/**
 * What-if simulation - pure, deterministic re-scoring of the period under
 * hypothetical category changes ("cut Transport 10%").
 *
 * Both the baseline and the adjusted scenario are derived through the SAME
 * path (category rows → totals → scoreHealth), so simulate(model, {}) is an
 * exact identity and can never disagree with the report's own score.
 *
 * Same POPIA/FAIS constraints as insights.ts: local, educational, no advice.
 */

import { isFlexibleCategory, monthsSpanned, scoreHealth, type HealthBand } from "./score";
import type { ExpenseCategoryRow, MonthlySpend } from "./types";

/** categoryId → percentage change (-50 = cut by half, +20 = spend 20% more). */
export type WhatIfChanges = Record<string, number>;

/** The model fields the simulator reads - ReportModel satisfies this. */
export type SimulatableModel = {
  totalIncomeCents: number;
  dayToDayBudgetedCents: number;
  expenseCategories: ExpenseCategoryRow[];
  monthlySpend: Pick<MonthlySpend, "isPartial">[];
};

export type WhatIfOutcome = {
  healthScore: number;
  healthBand: HealthBand;
  netCents: number;
  savingsRatePct: number;
  consumptionCents: number;
  setAsideCents: number;
  totalExpenseCents: number;
};

export type SimulationResult = {
  baseline: WhatIfOutcome;
  adjusted: WhatIfOutcome;
  scoreDelta: number;
  netDeltaCents: number;
  savingsRateDeltaPct: number;
  /** Positive = money freed by the changes, per average month in the period. */
  monthlyFreedCents: number;
  /** monthlyFreedCents × 12 - the "over a year" framing. */
  annualFreedCents: number;
  /** Complete months the per-month figures are averaged over. */
  months: number;
};

/**
 * Top categories worth putting a slider on: flexible day-to-day spending
 * (needs/wants that aren't fixed obligations), biggest first.
 */
export function flexibleRows(model: Pick<SimulatableModel, "expenseCategories">, limit = 4): ExpenseCategoryRow[] {
  return model.expenseCategories
    .filter(isFlexibleCategory)
    .slice()
    .sort((a, b) => b.actualCents - a.actualCents)
    .slice(0, limit);
}

/** Clamp to something arithmetically sane: can't cut more than everything. */
function clampPct(pct: number): number {
  if (!Number.isFinite(pct)) return 0;
  return Math.max(-100, Math.min(500, pct));
}

function derive(model: SimulatableModel, changes: WhatIfChanges): WhatIfOutcome {
  // Adjust rows, mirroring aggregate.ts's formulas for variance so the
  // budget-discipline scorer sees the same shapes the report builder makes.
  const rows = model.expenseCategories.map((r) => {
    const pct = clampPct(changes[r.categoryId] ?? 0);
    if (pct === 0) return r;
    const actualCents = Math.round(r.actualCents * (1 + pct / 100));
    return {
      ...r,
      actualCents,
      varianceCents: r.hasBudget ? actualCents - r.budgetedCents : 0,
      variancePct: r.hasBudget && r.budgetedCents > 0 ? Math.round((actualCents / r.budgetedCents) * 100) : r.variancePct,
    };
  });

  const totalExpenseCents = rows.reduce((s, r) => s + r.actualCents, 0);
  const setAsideCents = rows.filter((r) => r.isSavingsVehicle).reduce((s, r) => s + r.actualCents, 0);
  const consumptionCents = totalExpenseCents - setAsideCents;
  const netCents = model.totalIncomeCents - totalExpenseCents;
  const savingsRatePct =
    model.totalIncomeCents > 0 ? Math.round((setAsideCents / model.totalIncomeCents) * 100) : 0;
  const budgetedActualCents = rows
    .filter((r) => r.hasBudget && !r.isSavingsVehicle)
    .reduce((s, r) => s + r.actualCents, 0);
  const budgetUsedPct =
    model.dayToDayBudgetedCents > 0
      ? Math.round((budgetedActualCents / model.dayToDayBudgetedCents) * 100)
      : null;
  const unclassifiedCents = rows
    .filter((r) => r.group === "unclassified")
    .reduce((s, r) => s + r.actualCents, 0);
  const unclassifiedExpenseSharePct =
    totalExpenseCents > 0 ? Math.round((unclassifiedCents / totalExpenseCents) * 100) : 0;

  const health = scoreHealth({
    totalIncomeCents: model.totalIncomeCents,
    netCents,
    savingsRatePct,
    consumptionCents,
    dayToDayBudgetedCents: model.dayToDayBudgetedCents,
    budgetedActualCents,
    budgetUsedPct,
    expenseCategories: rows,
    dataQuality: { unclassifiedExpenseSharePct },
  });

  return {
    healthScore: health.healthScore,
    healthBand: health.healthBand,
    netCents,
    savingsRatePct,
    consumptionCents,
    setAsideCents,
    totalExpenseCents,
  };
}

export function simulate(model: SimulatableModel, changes: WhatIfChanges): SimulationResult {
  const baseline = derive(model, {});
  const adjusted = derive(model, changes);
  const months = monthsSpanned(model.monthlySpend);
  const freedCents = baseline.totalExpenseCents - adjusted.totalExpenseCents;
  const monthlyFreedCents = Math.round(freedCents / months);
  return {
    baseline,
    adjusted,
    scoreDelta: adjusted.healthScore - baseline.healthScore,
    netDeltaCents: adjusted.netCents - baseline.netCents,
    savingsRateDeltaPct: adjusted.savingsRatePct - baseline.savingsRatePct,
    monthlyFreedCents,
    annualFreedCents: monthlyFreedCents * 12,
    months,
  };
}
