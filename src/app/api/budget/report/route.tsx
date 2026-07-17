import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { renderToBuffer } from "@react-pdf/renderer";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";
import {
  assertReportModel,
  buildReport,
  sumDbEntriesCents,
} from "@/lib/budget/report/aggregate";
import { BudgetReportDocument } from "@/lib/budget/report/pdf";
import { precedingPeriod } from "@/lib/budget/report/period";
import type { BudgetEntryInput, BudgetTargetInput, CategoryMeta } from "@/lib/budget/report/types";

export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { periodStart?: string; periodEnd?: string; savingsCategoryIds?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const savingsCategoryIds = Array.isArray(body.savingsCategoryIds)
    ? body.savingsCategoryIds.filter((s): s is string => typeof s === "string").slice(0, 50)
    : undefined;

  const { periodStart, periodEnd } = body;
  if (
    !periodStart ||
    !periodEnd ||
    !/^\d{4}-\d{2}-\d{2}$/.test(periodStart) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(periodEnd) ||
    periodEnd < periodStart
  ) {
    return NextResponse.json({ error: "Invalid period range" }, { status: 400 });
  }

  const admin = createServiceSupabase();

  // Preceding equal-length window - powers the "vs previous period" deltas.
  const prev = precedingPeriod(periodStart, periodEnd);

  const [entriesRes, prevEntriesRes, targetsRes, catsRes, profileRes, progressRes] = await Promise.all([
    admin
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date, is_transfer")
      .eq("user_id", user.id)
      .gte("entry_date", periodStart)
      .lte("entry_date", periodEnd),
    admin
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date, is_transfer")
      .eq("user_id", user.id)
      .gte("entry_date", prev.periodStart)
      .lte("entry_date", prev.periodEnd),
    admin
      .from("budget_targets")
      .select("category, monthly_limit, month_year")
      .eq("user_id", user.id),
    admin
      .from("custom_budget_categories")
      .select("id, name, color, icon_name, type")
      .eq("user_id", user.id),
    admin
      .from("profiles")
      // NB: profiles has NO display_name column - selecting it made this whole
      // query error (42703) and silently produced the "Fundi user" fallback.
      .select("full_name, username")
      .eq("user_id", user.id)
      .maybeSingle(),
    admin
      .from("user_progress")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (entriesRes.error) {
    return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });
  }
  if (targetsRes.error) {
    return NextResponse.json({ error: targetsRes.error.message }, { status: 500 });
  }
  if (catsRes.error) {
    return NextResponse.json({ error: catsRes.error.message }, { status: 500 });
  }

  type DbEntry = {
    id: string;
    type: "income" | "expense";
    category: string;
    amount: number;
    description: string | null;
    entry_date: string;
    is_transfer?: boolean;
  };
  const mapEntry = (e: DbEntry): BudgetEntryInput => ({
    id: e.id,
    type: e.type,
    category: e.category,
    amount: Number(e.amount),
    description: e.description,
    entry_date: e.entry_date,
    is_transfer: e.is_transfer ?? false,
  });
  const entries = ((entriesRes.data ?? []) as DbEntry[]).map(mapEntry);
  // Comparison data is best-effort: a fetch error just disables the deltas.
  const prevEntries = prevEntriesRes.error
    ? []
    : ((prevEntriesRes.data ?? []) as DbEntry[]).map(mapEntry);
  const targets = (targetsRes.data ?? []) as BudgetTargetInput[];
  const categories: CategoryMeta[] = (catsRes.data ?? []).map(
    (c: { id: string; name: string; color: string; type: "expense" | "income" }) => ({
      id: c.id,
      name: c.name,
      color: c.color,
      type: c.type,
    })
  );

  const profile = profileRes.data as
    | { full_name?: string; username?: string }
    | null;
  const progress = progressRes.data as { display_name?: string } | null;
  if (profileRes.error) console.error("[budget/report] profile lookup:", profileRes.error.message);

  /** First word only - the report greets by first name, never the full name. */
  const firstNameOf = (s?: string | null) => (s ?? "").trim().split(/\s+/)[0] ?? "";
  const displayName =
    firstNameOf(profile?.full_name) ||
    profile?.username?.trim() ||
    progress?.display_name?.trim() ||
    "Fundi user";

  // Fetch the Fundi logo (public asset) and inline it as a data URI so the PDF
  // is self-contained. Graceful: if it fails, the report renders without it.
  let logoDataUri: string | undefined;
  try {
    const origin = req.nextUrl.origin;
    const logoRes = await fetch(`${origin}/Logo.png`);
    if (logoRes.ok) {
      const buf = Buffer.from(await logoRes.arrayBuffer());
      logoDataUri = `data:image/png;base64,${buf.toString("base64")}`;
    }
  } catch {
    logoDataUri = undefined;
  }

  const model = buildReport(
    entries,
    targets,
    categories,
    periodStart,
    periodEnd,
    displayName,
    undefined,
    {
      savingsCategoryIds,
      prevEntries,
      prevStart: prev.periodStart,
      prevEnd: prev.periodEnd,
    }
  );

  try {
    assertReportModel(model);
    const dbSums = sumDbEntriesCents(entries, periodStart, periodEnd);
    if (dbSums.incomeCents !== model.totalIncomeCents) {
      throw new Error(
        `DB income mismatch: ${dbSums.incomeCents} !== ${model.totalIncomeCents}`
      );
    }
    if (dbSums.expenseCents !== model.totalExpenseCents) {
      throw new Error(
        `DB expense mismatch: ${dbSums.expenseCents} !== ${model.totalExpenseCents}`
      );
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Report validation failed";
    console.error("[budget/report]", message);
    return NextResponse.json({ error: "Report validation failed" }, { status: 500 });
  }

  // Server-side @react-pdf render: element is constructed here, outside the
  // try, because renderToBuffer rejects on failure - no error boundary exists.
  const reportDoc = <BudgetReportDocument model={model} logoDataUri={logoDataUri} />;
  try {
    const buffer = await renderToBuffer(reportDoc);
    const filename = `fundi-budget-report-${periodStart}_${periodEnd}.pdf`;
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[budget/report] PDF render failed", err);
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 });
  }
}
