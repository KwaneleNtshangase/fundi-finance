import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/apiAuth";
import { createServiceSupabase } from "@/lib/supabaseServer";
import { buildReport } from "@/lib/budget/report/aggregate";
import {
  enumerateMonths,
  firstDayOfMonthYear,
  lastDayOfMonthYear,
  minDate,
} from "@/lib/budget/report/period";
import { snapshotFingerprint, snapshotMetricsOf } from "@/lib/budget/report/snapshot";
import { sastToday } from "@/lib/dates";
import type {
  BudgetEntryInput,
  BudgetTargetInput,
  CategoryMeta,
  ReportSnapshotMetrics,
} from "@/lib/budget/report/types";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Score history: one point per month for the trend line.
 *
 * Phase 4: months are served from `report_snapshots` when a snapshot's
 * fingerprint still matches the month's entries+targets; anything missing or
 * stale is retro-computed from transactions (the pre-snapshot behaviour) and
 * written back. Editing history changes the fingerprint, so a snapshot can
 * never serve stale numbers.
 */
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let months = 12;
  try {
    const body = await req.json();
    if (typeof body?.months === "number") months = Math.min(24, Math.max(2, Math.round(body.months)));
  } catch {
    /* defaults */
  }

  const today = sastToday();
  const [ty, tm] = today.split("-").map(Number);
  // Window start = first day of the month (months-1) before the current month.
  let sy = ty;
  let sm = tm - (months - 1);
  while (sm <= 0) { sm += 12; sy -= 1; }
  const windowStart = `${sy}-${String(sm).padStart(2, "0")}-01`;

  const admin = createServiceSupabase();
  const [entriesRes, targetsRes, catsRes, snapsRes] = await Promise.all([
    admin
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date, is_transfer")
      .eq("user_id", user.id)
      .gte("entry_date", windowStart)
      .lte("entry_date", today),
    admin.from("budget_targets").select("category, monthly_limit, month_year").eq("user_id", user.id),
    admin.from("custom_budget_categories").select("id, name, color, type").eq("user_id", user.id),
    // Best-effort snapshot cache; errors just mean recompute-everything.
    admin
      .from("report_snapshots")
      .select("period_start, period_end, metrics")
      .eq("user_id", user.id)
      .gte("period_start", windowStart),
  ]);

  if (entriesRes.error) return NextResponse.json({ error: entriesRes.error.message }, { status: 500 });

  type DbEntry = {
    id: string; type: "income" | "expense"; category: string; amount: number;
    description: string | null; entry_date: string; is_transfer?: boolean;
  };
  const allEntries: BudgetEntryInput[] = ((entriesRes.data ?? []) as DbEntry[]).map((e) => ({
    id: e.id, type: e.type, category: e.category, amount: Number(e.amount),
    description: e.description, entry_date: e.entry_date, is_transfer: e.is_transfer ?? false,
  }));
  const targets = (targetsRes.data ?? []) as BudgetTargetInput[];
  const categories: CategoryMeta[] = (catsRes.data ?? []).map(
    (c: { id: string; name: string; color: string; type: "expense" | "income" }) => ({
      id: c.id, name: c.name, color: c.color, type: c.type,
    })
  );

  // Snapshot lookup keyed by exact period bounds.
  const snapByPeriod = new Map<string, ReportSnapshotMetrics>();
  if (!snapsRes.error) {
    for (const s of (snapsRes.data ?? []) as { period_start: string; period_end: string; metrics: ReportSnapshotMetrics }[]) {
      snapByPeriod.set(`${s.period_start}|${s.period_end}`, s.metrics);
    }
  }
  const upserts: { user_id: string; period_start: string; period_end: string; metrics: ReportSnapshotMetrics; updated_at: string }[] = [];

  const history = enumerateMonths(windowStart, today)
    .map((monthYear) => {
      const start = firstDayOfMonthYear(monthYear);
      const end = minDate(lastDayOfMonthYear(monthYear), today);
      const monthEntries = allEntries.filter((e) => e.entry_date >= start && e.entry_date <= end);
      // Skip months with no activity so an unsynced month can't dent the trend.
      const hasActivity = monthEntries.some((e) => !e.is_transfer);
      if (!hasActivity) return null;
      const [, m] = monthYear.split("-").map(Number);
      const label = MONTH_SHORT[m - 1];

      // Serve from the snapshot when its fingerprint still matches this
      // month's data; otherwise recompute and write the snapshot back.
      const snap = snapByPeriod.get(`${start}|${end}`);
      const fp = snapshotFingerprint(monthEntries, targets, start, end);
      if (
        snap &&
        snap.fpCount === fp.fpCount &&
        snap.fpSumCents === fp.fpSumCents &&
        snap.fpMix === fp.fpMix
      ) {
        return {
          monthYear,
          label,
          healthScore: snap.healthScore,
          healthBand: snap.healthBand,
          savingsRatePct: snap.savingsRatePct,
          netCents: snap.netCents,
          incomeCents: snap.incomeCents,
          consumptionCents: snap.consumptionCents,
          setAsideCents: snap.setAsideCents,
          unclassifiedPct: snap.unclassifiedPct,
        };
      }

      const model = buildReport(monthEntries, targets, categories, start, end, "");
      // Cache only COMPLETE months. The in-progress month's end date moves
      // daily - each write would mint a new (start, end) row - and its
      // numbers are still changing, so a snapshot of it caches nothing.
      if (end === lastDayOfMonthYear(monthYear)) {
        upserts.push({
          user_id: user.id,
          period_start: start,
          period_end: end,
          metrics: snapshotMetricsOf(model, monthEntries, targets),
          updated_at: new Date().toISOString(),
        });
      }
      return {
        monthYear,
        label,
        healthScore: model.insights.healthScore,
        healthBand: model.insights.healthBand,
        savingsRatePct: model.savingsRatePct,
        netCents: model.netCents,
        incomeCents: model.totalIncomeCents,
        consumptionCents: model.consumptionCents,
        setAsideCents: model.setAsideCents,
        unclassifiedPct: model.dataQuality.unclassifiedExpenseSharePct,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  if (upserts.length > 0) {
    const { error: upsertErr } = await admin
      .from("report_snapshots")
      .upsert(upserts, { onConflict: "user_id,period_start,period_end" });
    if (upsertErr) console.error("[budget/report/history] snapshot upsert:", upsertErr.message);
  }

  return NextResponse.json({ ok: true, history });
}
