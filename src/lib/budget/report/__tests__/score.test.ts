import { describe, expect, it } from "vitest";
import { assertReportModel, buildReport } from "../aggregate";
import { scoreHealth } from "../score";
import { flexibleRows, simulate } from "../simulate";
import type { BudgetEntryInput, BudgetTargetInput } from "../types";

const FIXED_AT = "2026-06-15T10:00:00.000Z";

function report(
  entries: BudgetEntryInput[],
  targets: BudgetTargetInput[] = [],
  periodStart = "2026-06-01",
  periodEnd = "2026-06-30"
) {
  const model = buildReport(entries, targets, [], periodStart, periodEnd, "Test User", FIXED_AT);
  assertReportModel(model);
  return model;
}

/** Healthy month: surplus, 15% savings rate, light debt, one fixed obligation. */
const RICH: BudgetEntryInput[] = [
  { type: "income", category: "salary", amount: 20000, entry_date: "2026-06-01" },
  { type: "expense", category: "housing", amount: 6000, entry_date: "2026-06-02" },
  { type: "expense", category: "food", amount: 4000, entry_date: "2026-06-05" },
  { type: "expense", category: "transport", amount: 2500, entry_date: "2026-06-06" },
  { type: "expense", category: "entertainment", amount: 1500, entry_date: "2026-06-07" },
  { type: "expense", category: "savings", amount: 3000, entry_date: "2026-06-03" },
  { type: "expense", category: "debt", amount: 1000, entry_date: "2026-06-04" },
];

/** Deficit month: day-to-day spending alone eats the income. */
const DEFICIT: BudgetEntryInput[] = [
  { type: "income", category: "salary", amount: 10000, entry_date: "2026-06-01" },
  { type: "expense", category: "food", amount: 9000, entry_date: "2026-06-05" },
  { type: "expense", category: "savings", amount: 2000, entry_date: "2026-06-02" },
];

describe("scoreHealth (single source of truth)", () => {
  it("matches the report's own score exactly", () => {
    const model = report(RICH);
    const health = scoreHealth(model);
    expect(health.healthScore).toBe(model.insights.healthScore);
    expect(health.healthBand).toBe(model.insights.healthBand);
    expect(health.healthComponents).toEqual(model.insights.healthComponents);
    expect(health.healthCapNote).toBe(model.insights.healthCapNote);
  });

  it("matches under deficit caps and with budgets set", () => {
    const deficit = report(DEFICIT);
    expect(scoreHealth(deficit).healthScore).toBe(deficit.insights.healthScore);

    const budgeted = report(RICH, [{ category: "food", monthly_limit: 4500, month_year: "2026-06" }]);
    expect(scoreHealth(budgeted).healthScore).toBe(budgeted.insights.healthScore);
  });
});

describe("simulate", () => {
  it("identity: no changes means zero deltas and the report's own score", () => {
    const model = report(RICH);
    const sim = simulate(model, {});
    expect(sim.scoreDelta).toBe(0);
    expect(sim.netDeltaCents).toBe(0);
    expect(sim.savingsRateDeltaPct).toBe(0);
    expect(sim.monthlyFreedCents).toBe(0);
    // The critical parity: the simulator's derived baseline (rows → totals →
    // score) lands on the SAME number the report computed via aggregate.ts.
    expect(sim.baseline.healthScore).toBe(model.insights.healthScore);
    expect(sim.baseline.netCents).toBe(model.netCents);
    expect(sim.baseline.totalExpenseCents).toBe(model.totalExpenseCents);
    expect(sim.baseline.savingsRatePct).toBe(model.savingsRatePct);
  });

  it("identity parity holds with budgets, including a misaligned one", () => {
    const budgeted = report(RICH, [{ category: "food", monthly_limit: 4500, month_year: "2026-06" }]);
    expect(simulate(budgeted, {}).baseline.healthScore).toBe(budgeted.insights.healthScore);

    // Misaligned: R20 000 budget on R4 000 spend triggers the coverage penalty
    // in the report - the simulator must see it identically.
    const misaligned = report(RICH, [{ category: "food", monthly_limit: 20000, month_year: "2026-06" }]);
    expect(simulate(misaligned, {}).baseline.healthScore).toBe(misaligned.insights.healthScore);
  });

  it("cutting a flexible category frees money without hurting the score", () => {
    const model = report(RICH);
    const sim = simulate(model, { food: -10 });
    // Food R4 000 → R3 600: R400/month freed.
    expect(sim.adjusted.consumptionCents).toBe(model.consumptionCents - 40000);
    expect(sim.netDeltaCents).toBe(40000);
    expect(sim.monthlyFreedCents).toBe(40000);
    expect(sim.annualFreedCents).toBe(480000);
    expect(sim.scoreDelta).toBeGreaterThanOrEqual(0);
    // Spending less isn't the same as saving more - the set-aside rate holds.
    expect(sim.adjusted.savingsRatePct).toBe(sim.baseline.savingsRatePct);
  });

  it("spending more costs money and never raises the score", () => {
    const model = report(RICH);
    const sim = simulate(model, { entertainment: 30 });
    expect(sim.netDeltaCents).toBe(-45000);
    expect(sim.monthlyFreedCents).toBe(-45000);
    expect(sim.scoreDelta).toBeLessThanOrEqual(0);
  });

  it("a big enough cut flips a deficit into surplus and lifts the score", () => {
    const model = report(DEFICIT);
    expect(model.netCents).toBe(-100000);
    const sim = simulate(model, { food: -30 });
    // Food R9 000 → R6 300: net -R1 000 → +R1 700.
    expect(sim.adjusted.netCents).toBe(170000);
    expect(sim.scoreDelta).toBeGreaterThan(0);
  });

  it("boosting a savings vehicle lifts the set-aside rate, not consumption", () => {
    const model = report(RICH);
    const sim = simulate(model, { savings: 20 });
    expect(sim.adjusted.setAsideCents).toBe(360000);
    expect(sim.adjusted.savingsRatePct).toBe(18);
    expect(sim.adjusted.consumptionCents).toBe(model.consumptionCents);
    // More money out overall, so net falls - but it went to savings.
    expect(sim.adjusted.netCents).toBe(model.netCents - 60000);
  });

  it("clamps cuts at -100% so spending can't go negative", () => {
    const model = report(RICH);
    const sim = simulate(model, { food: -500 });
    expect(sim.adjusted.consumptionCents).toBe(model.consumptionCents - 400000);
  });
});

describe("flexibleRows", () => {
  it("keeps needs/wants, drops fixed obligations, debt and savings; biggest first", () => {
    const model = report(RICH);
    const rows = flexibleRows(model);
    // Housing/Rent is a fixed obligation; savings and debt are commitments.
    expect(rows.map((r) => r.categoryId)).toEqual(["food", "transport", "entertainment"]);
  });

  it("respects the limit", () => {
    const model = report(RICH);
    expect(flexibleRows(model, 2).map((r) => r.categoryId)).toEqual(["food", "transport"]);
  });
});
