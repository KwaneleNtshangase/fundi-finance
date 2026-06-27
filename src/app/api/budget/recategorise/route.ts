import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { categorise } from "@/lib/categorisation";
import type { NormalizedTxn, UserMerchantRule } from "@/lib/budget/types";

type CustomBudgetCategory = {
  id: string;
  name: string;
  type: "income" | "expense";
};

const UNCATEGORISED = new Set(["other", "other-income"]);

/**
 * Re-run categorisation over the user's entries that are currently uncategorised
 * ("other" / "other-income"). This safely upgrades historical rows that were
 * imported before the categorisation rules (or the user's custom categories)
 * existed. It never touches rows the user has already placed in a real category,
 * and never flips income/expense direction.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let dryRun = false;
  try {
    const body = await req.json();
    dryRun = body?.dryRun === true;
  } catch {
    dryRun = false;
  }

  const admin = createServiceSupabase();

  const [rulesRes, catsRes, entriesRes] = await Promise.all([
    admin
      .from("user_merchant_rules")
      .select("merchant_pattern, category, type")
      .eq("user_id", user.id),
    admin
      .from("custom_budget_categories")
      .select("id, name, type")
      .eq("user_id", user.id),
    admin
      .from("budget_entries")
      .select("id, description, amount, type, is_transfer")
      .eq("user_id", user.id)
      .in("category", ["other", "other-income"]),
  ]);

  if (entriesRes.error) {
    return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });
  }

  const userRules = (rulesRes.data ?? []) as UserMerchantRule[];
  const customCategories = (catsRes.data ?? []) as CustomBudgetCategory[];
  const entries = (entriesRes.data ?? []) as Array<{
    id: string;
    description: string | null;
    amount: number;
    type: "income" | "expense";
    is_transfer?: boolean;
  }>;

  const updates: Array<{ id: string; category: string }> = [];

  for (const e of entries) {
    if (e.is_transfer) continue; // leave transfers alone
    const desc = e.description ?? "";
    const signed = e.type === "income" ? Math.abs(Number(e.amount)) : -Math.abs(Number(e.amount));
    const txn: NormalizedTxn = {
      date: "1970-01-01",
      description: desc,
      amountZAR: signed,
      rawMerchant: desc,
      lineIndex: 0,
    };
    const result = categorise(txn, userRules, customCategories);
    // Only upgrade: same direction, and resolved to a real (non-"other") category.
    if (result.type === e.type && !UNCATEGORISED.has(result.category) && result.category !== (e.type === "income" ? "other-income" : "other")) {
      updates.push({ id: e.id, category: result.category });
    }
  }

  // Breakdown of would-be target categories (resolved to display ids).
  const byCategory: Record<string, number> = {};
  for (const u of updates) byCategory[u.category] = (byCategory[u.category] ?? 0) + 1;

  if (dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      scanned: entries.length,
      wouldUpdate: updates.length,
      byCategory,
    });
  }

  let updated = 0;
  const CHUNK = 50;
  for (let i = 0; i < updates.length; i += CHUNK) {
    const chunk = updates.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map((u) =>
        admin
          .from("budget_entries")
          .update({ category: u.category })
          .eq("id", u.id)
          .eq("user_id", user.id)
      )
    );
    updated += results.filter((r) => !r.error).length;
  }

  return NextResponse.json({
    ok: true,
    scanned: entries.length,
    updated,
    byCategory,
  });
}
