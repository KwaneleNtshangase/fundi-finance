/**
 * Report snapshots (Phase 4) - the pure logic behind `report_snapshots`.
 *
 * A snapshot is a small JSONB metric bundle per (user, period):
 *   - metrics for trends/streaks without rebuilding the report,
 *   - the period's top action, so the NEXT report can check follow-through,
 *   - a fingerprint of the entries+targets it was computed from, so editing
 *     history invalidates the snapshot instead of serving stale numbers.
 *
 * Everything here is deterministic and side-effect free; the API routes do
 * the reading/writing.
 */

import { formatZarCurrency } from "@/lib/currency";
import { sumDbEntriesCents } from "./aggregate";
import { enumerateMonths } from "./period";
import { debtCents, misalignedBudgetCount, monthsSpanned } from "./score";
import type {
  BudgetEntryInput,
  BudgetTargetInput,
  ReportModel,
  ReportSnapshotMetrics,
} from "./types";

function rand(cents: number): string {
  return formatZarCurrency(Math.round(cents / 100), { decimals: 0 });
}

function pctOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** FNV-1a 32-bit - tiny, deterministic, plenty for cache invalidation. */
function hash32(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Cheap change-detector for a period's inputs. Any entry added, removed,
 * re-amounted, re-typed or RECATEGORISED changes it (recategorising updates
 * rows in place, so count+sum alone would go stale - `fpMix` hashes
 * category/type/amount per entry, order-independently). Budget changes for
 * a month the period touches change it too.
 */
export function snapshotFingerprint(
  entries: BudgetEntryInput[],
  targets: BudgetTargetInput[],
  periodStart: string,
  periodEnd: string
): { fpCount: number; fpSumCents: number; fpMix: number } {
  const sums = sumDbEntriesCents(entries, periodStart, periodEnd);
  let fpCount = 0;
  let fpMix = 0;
  for (const e of entries) {
    if (e.is_transfer) continue;
    if (e.entry_date >= periodStart && e.entry_date <= periodEnd) {
      fpCount += 1;
      fpMix = (fpMix + hash32(`${e.category}|${e.type}|${Math.round(e.amount * 100)}|${e.entry_date}`)) >>> 0;
    }
  }
  const months = new Set(enumerateMonths(periodStart, periodEnd));
  let targetCents = 0;
  for (const t of targets) {
    if (months.has(t.month_year)) {
      fpCount += 1;
      targetCents += Math.round(t.monthly_limit * 100);
      fpMix = (fpMix + hash32(`target|${t.category}|${t.month_year}|${t.monthly_limit}`)) >>> 0;
    }
  }
  return { fpCount, fpSumCents: sums.incomeCents + sums.expenseCents + targetCents, fpMix };
}

/** Build the persistable metric bundle from a computed report model. */
export function snapshotMetricsOf(
  model: ReportModel,
  entries: BudgetEntryInput[],
  targets: BudgetTargetInput[]
): ReportSnapshotMetrics {
  const fp = snapshotFingerprint(entries, targets, model.periodStart, model.periodEnd);
  const months = monthsSpanned(model.monthlySpend);
  const top = model.insights.actions.find((a) => a.isTopPriority) ?? model.insights.actions[0] ?? null;
  let trimCategoryMonthlyCents: number | null = null;
  if (top && top.id.startsWith("trim-")) {
    const catId = top.id.slice(5);
    const row = model.expenseCategories.find((r) => r.categoryId === catId);
    if (row) trimCategoryMonthlyCents = Math.round(row.actualCents / months);
  }
  return {
    healthScore: model.insights.healthScore,
    healthBand: model.insights.healthBand,
    verdict: model.insights.verdict,
    savingsRatePct: model.savingsRatePct,
    netCents: model.netCents,
    incomeCents: model.totalIncomeCents,
    consumptionCents: model.consumptionCents,
    setAsideCents: model.setAsideCents,
    unclassifiedPct: model.dataQuality.unclassifiedExpenseSharePct,
    debtSharePct: pctOf(debtCents(model), model.totalIncomeCents),
    budgetCoveredPct: pctOf(model.budgetedActualCents, model.consumptionCents),
    misalignedBudgetCount: misalignedBudgetCount(model),
    months,
    topActionId: top?.id ?? null,
    topActionTitle: top?.title ?? null,
    trimCategoryMonthlyCents,
    ...fp,
  };
}

export type MissionOutcome = {
  /** The previous report's top action. */
  title: string;
  status: "done" | "open" | "unmeasured";
  /** One factual sentence with the before/after numbers. */
  detail: string;
};

/**
 * Did last period's single most important action actually happen? Compares
 * the metric each action targets between the previous snapshot and the
 * current model. Honest by design: actions we can't measure from
 * transactions say so instead of guessing.
 */
export function missionOutcome(
  prev: ReportSnapshotMetrics | null | undefined,
  model: ReportModel
): MissionOutcome | null {
  if (!prev || !prev.topActionId || !prev.topActionTitle) return null;
  const id = prev.topActionId;
  const title = prev.topActionTitle;

  if (id === "recategorise") {
    const cur = model.dataQuality.unclassifiedExpenseSharePct;
    const done = cur <= 20 || cur <= prev.unclassifiedPct - 5;
    return {
      title,
      status: done ? "done" : "open",
      detail: `Unclassified spend went ${prev.unclassifiedPct}% → ${cur}%.`,
    };
  }
  if (id === "payday-setaside") {
    const done = model.savingsRatePct >= prev.savingsRatePct + 2;
    return {
      title,
      status: done ? "done" : "open",
      detail: `Set-aside rate went ${prev.savingsRatePct}% → ${model.savingsRatePct}% of income.`,
    };
  }
  if (id === "first-budgets") {
    const done = model.dayToDayBudgetedCents > 0;
    return {
      title,
      status: done ? "done" : "open",
      detail: done ? "Day-to-day budgets are now in place." : "No day-to-day budgets set yet.",
    };
  }
  if (id === "cover-unbudgeted") {
    const cur = pctOf(model.budgetedActualCents, model.consumptionCents);
    const done = cur >= prev.budgetCoveredPct + 10;
    return {
      title,
      status: done ? "done" : "open",
      detail: `Budgets now cover ${cur}% of day-to-day spend (was ${prev.budgetCoveredPct}%).`,
    };
  }
  if (id === "recalibrate-budget") {
    const cur = misalignedBudgetCount(model);
    const done = cur < prev.misalignedBudgetCount;
    return {
      title,
      status: done ? "done" : "open",
      detail: done
        ? "The oversized budget has been brought in line."
        : `${cur} budget${cur === 1 ? " is" : "s are"} still set far above actual spend.`,
    };
  }
  if (id.startsWith("trim-")) {
    const catId = id.slice(5);
    const row = model.expenseCategories.find((r) => r.categoryId === catId);
    const curMonthly = row ? Math.round(row.actualCents / monthsSpanned(model.monthlySpend)) : 0;
    if (prev.trimCategoryMonthlyCents == null) {
      return { title, status: "unmeasured", detail: "No baseline was stored for this one." };
    }
    const done = curMonthly <= Math.round(prev.trimCategoryMonthlyCents * 0.95);
    return {
      title,
      status: done ? "done" : "open",
      detail: `${row?.categoryName ?? "That category"} went ~${rand(prev.trimCategoryMonthlyCents)}/month → ~${rand(curMonthly)}/month.`,
    };
  }
  if (id === "keep-streak") {
    const done = model.netCents >= 0;
    return {
      title,
      status: done ? "done" : "open",
      detail: done
        ? `Still in the green: ${rand(model.netCents)} ahead this period.`
        : `This period ended ${rand(-model.netCents)} short.`,
    };
  }
  if (id === "map-debts") {
    return {
      title,
      status: "unmeasured",
      detail: "Mapping debts happens outside the app, so this one can't be checked from transactions.",
    };
  }
  return { title, status: "unmeasured", detail: "This action can't be measured from transactions alone." };
}

export type StreakSummary = {
  /** Consecutive COMPLETE months (ending with the most recent complete one) with net ≥ 0. */
  greenMonths: number;
  /** Consecutive month-over-month health-score rises up to the most recent complete month. */
  scoreUps: number;
};

/**
 * Streaks over the score-history series. Only complete months count - the
 * in-progress month can't break (or fake) a streak halfway through.
 */
export function computeStreaks(
  history: { monthYear: string; healthScore: number; netCents: number }[],
  currentMonthYear: string
): StreakSummary {
  const complete = history
    .filter((h) => h.monthYear < currentMonthYear)
    .sort((a, b) => (a.monthYear < b.monthYear ? -1 : 1));
  let greenMonths = 0;
  for (let i = complete.length - 1; i >= 0; i--) {
    if (complete[i].netCents >= 0) greenMonths += 1;
    else break;
  }
  let scoreUps = 0;
  for (let i = complete.length - 1; i >= 1; i--) {
    if (complete[i].healthScore > complete[i - 1].healthScore) scoreUps += 1;
    else break;
  }
  return { greenMonths, scoreUps };
}
