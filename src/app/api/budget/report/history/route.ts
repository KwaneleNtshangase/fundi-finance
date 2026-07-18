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
import { sastToday } from "@/lib/dates";
import type { BudgetEntryInput, BudgetTargetInput, CategoryMeta } from "@/lib/budget/report/types";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Score history: retro-computes a report for each of the last N calendar months
 * from the transactions we already have (no snapshot storage needed), and
 * returns the per-month metric series that powers the trend line.
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
  const [entriesRes, targetsRes, catsRes] = await Promise.all([
    admin
      .from("budget_entries")
      .select("id, type, category, amount, description, entry_date, is_transfer")
      .eq("user_id", user.id)
      .gte("entry_date", windowStart)
      .lte("entry_date", today),
    admin.from("budget_targets").select("category, monthly_limit, month_year").eq("user_id", user.id),
    admin.from("custom_budget_categories").select("id, name, color, type").eq("user_id", user.id),
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

  const history = enumerateMonths(windowStart, today)
    .map((monthYear) => {
      const start = firstDayOfMonthYear(monthYear);
      const end = minDate(lastDayOfMonthYear(monthYear), today);
      const monthEntries = allEntries.filter((e) => e.entry_date >= start && e.entry_date <= end);
      // Skip months with no activity so an unsynced month can't dent the trend.
      if (monthEntries.every((e) => e.is_transfer)) return null;
      const hasActivity = monthEntries.some((e) => !e.is_transfer);
      if (!hasActivity) return null;

      const model = buildReport(monthEntries, targets, categories, start, end, "");
      const [, m] = monthYear.split("-").map(Number);
      return {
        monthYear,
        label: MONTH_SHORT[m - 1],
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

  return NextResponse.json({ ok: true, history });
}
