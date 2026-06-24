import { describe, expect, it } from "vitest";
import { assertReportModel, buildReport } from "../aggregate";
import {
  formatPeriodLabel,
  inclusiveDayCount,
  lastDayOfMonthYear,
  monthAlignedDefaults,
  resolvePeriod,
} from "../period";
import type { BudgetEntryInput, BudgetTargetInput } from "../types";

const FIXED_AT = "2026-06-15T10:00:00.000Z";
const TODAY = "2026-06-15";

function report(
  entries: BudgetEntryInput[],
  targets: BudgetTargetInput[] = [],
  periodStart: string,
  periodEnd: string
) {
  const model = buildReport(entries, targets, [], periodStart, periodEnd, "Test User", FIXED_AT);
  assertReportModel(model);
  return model;
}

describe("buildReport", () => {
  it("empty period returns zero totals", () => {
    const model = report([], [], "2026-06-01", "2026-06-30");
    expect(model.totalIncomeCents).toBe(0);
    expect(model.totalExpenseCents).toBe(0);
    expect(model.netCents).toBe(0);
    expect(model.savingsRatePct).toBe(0);
    expect(model.expenseCategories).toEqual([]);
    expect(model.incomeCategories).toEqual([]);
    expect(model.budgetIsEstimate).toBe(false);
  });

  it("single expense transaction", () => {
    const model = report(
      [{ type: "expense", category: "food", amount: 150.5, entry_date: "2026-06-10" }],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    expect(model.totalExpenseCents).toBe(15050);
    expect(model.expenseCategories).toHaveLength(1);
    expect(model.expenseCategories[0].actualCents).toBe(15050);
    expect(model.expenseCategories[0].sharePct).toBe(100);
  });

  it("income refund counts as income", () => {
    const model = report(
      [
        { type: "income", category: "other-income", amount: 89.99, description: "Refund", entry_date: "2026-06-05" },
        { type: "expense", category: "food", amount: 200, entry_date: "2026-06-05" },
      ],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    expect(model.totalIncomeCents).toBe(8999);
    expect(model.totalExpenseCents).toBe(20000);
    expect(model.netCents).toBe(-11001);
    expect(model.incomeCategories[0].categoryId).toBe("other-income");
  });

  it("savings rate matches BudgetPlanner formula", () => {
    const model = report(
      [
        { type: "income", category: "salary", amount: 10000, entry_date: "2026-06-01" },
        { type: "expense", category: "savings", amount: 1500, entry_date: "2026-06-02" },
      ],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    expect(model.savingsRatePct).toBe(15);
  });

  it("category with budget but no spend", () => {
    const model = report(
      [],
      [{ category: "food", monthly_limit: 3000, month_year: "2026-06" }],
      "2026-06-01",
      "2026-06-30"
    );
    expect(model.totalBudgetedExpenseCents).toBe(300000);
    expect(model.expenseCategories).toHaveLength(1);
    expect(model.expenseCategories[0].actualCents).toBe(0);
    expect(model.expenseCategories[0].budgetedCents).toBe(300000);
    expect(model.budgetIsEstimate).toBe(false);
  });

  it("category with spend but no budget", () => {
    const model = report(
      [{ type: "expense", category: "transport", amount: 450, entry_date: "2026-06-12" }],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    const row = model.expenseCategories.find((r) => r.categoryId === "transport");
    expect(row?.budgetedCents).toBe(0);
    expect(row?.actualCents).toBe(45000);
    expect(row?.variancePct).toBeNull();
  });

  it("custom mid-month proration sets budgetIsEstimate", () => {
    const model = report(
      [{ type: "expense", category: "food", amount: 500, entry_date: "2026-06-10" }],
      [{ category: "food", monthly_limit: 3100, month_year: "2026-06" }],
      "2026-06-10",
      "2026-06-20"
    );
    expect(model.budgetIsEstimate).toBe(true);
    const daysOverlap = inclusiveDayCount("2026-06-10", "2026-06-20");
    const daysInMonth = inclusiveDayCount("2026-06-01", "2026-06-30");
    const expected = Math.round((310000 * daysOverlap) / daysInMonth);
    expect(model.expenseCategories[0].budgetedCents).toBe(expected);
  });

  it("whole-month period is exact budget (no estimate)", () => {
    const model = report(
      [],
      [{ category: "food", monthly_limit: 2500, month_year: "2026-05" }],
      "2026-05-01",
      "2026-05-31"
    );
    expect(model.budgetIsEstimate).toBe(false);
    expect(model.totalBudgetedExpenseCents).toBe(250000);
  });

  it("SAST month boundary — entry on last day of month included", () => {
    const model = report(
      [{ type: "expense", category: "food", amount: 99, entry_date: "2026-05-31" }],
      [],
      "2026-05-01",
      "2026-05-31"
    );
    expect(model.totalExpenseCents).toBe(9900);
  });

  it("leap Feb 2024 uses 29-day denominator", () => {
    const model = report(
      [],
      [{ category: "food", monthly_limit: 2900, month_year: "2024-02" }],
      "2024-02-01",
      "2024-02-15"
    );
    expect(model.budgetIsEstimate).toBe(true);
    const expected = Math.round((290000 * 15) / 29);
    expect(model.expenseCategories[0].budgetedCents).toBe(expected);
    expect(lastDayOfMonthYear("2024-02")).toBe("2024-02-29");
  });

  it("large values avoid float drift", () => {
    const model = report(
      [
        { type: "income", category: "salary", amount: 999999.99, entry_date: "2026-06-01" },
        { type: "expense", category: "housing", amount: 123456.78, entry_date: "2026-06-02" },
      ],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    expect(model.totalIncomeCents).toBe(99999999);
    expect(model.totalExpenseCents).toBe(12345678);
    expect(model.netCents).toBe(99999999 - 12345678);
  });

  it("top merchants case-fold and trim descriptions", () => {
    const model = report(
      [
        { type: "expense", category: "food", amount: 100, description: "  Woolworths ", entry_date: "2026-06-01" },
        { type: "expense", category: "food", amount: 50, description: "woolworths", entry_date: "2026-06-02" },
        { type: "expense", category: "food", amount: 30, description: "Checkers", entry_date: "2026-06-03" },
      ],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    expect(model.topMerchants[0].description).toBe("woolworths");
    expect(model.topMerchants[0].totalCents).toBe(15000);
  });

  it("fixed fixture snapshot", () => {
    const entries: BudgetEntryInput[] = [
      { id: "1", type: "income", category: "salary", amount: 25000, description: "Pay", entry_date: "2026-06-01" },
      { id: "2", type: "expense", category: "food", amount: 3200, description: "Groceries", entry_date: "2026-06-05" },
      { id: "3", type: "expense", category: "transport", amount: 1800, description: "Uber", entry_date: "2026-06-08" },
      { id: "4", type: "expense", category: "savings", amount: 2500, description: "Transfer", entry_date: "2026-06-10" },
    ];
    const targets: BudgetTargetInput[] = [
      { category: "food", monthly_limit: 4000, month_year: "2026-06" },
      { category: "transport", monthly_limit: 1500, month_year: "2026-06" },
      { category: "savings", monthly_limit: 3000, month_year: "2026-06" },
    ];
    const model = buildReport(entries, targets, [], "2026-06-01", "2026-06-30", "Snapshot User", FIXED_AT);
    assertReportModel(model);
    expect(model).toMatchSnapshot({
      generatedAt: expect.any(String),
    });
  });
});

describe("resolvePeriod presets", () => {
  it("this month caps at today", () => {
    const { periodStart, periodEnd } = resolvePeriod("this_month", undefined, TODAY);
    expect(periodStart).toBe("2026-06-01");
    expect(periodEnd).toBe("2026-06-15");
  });

  it("last month is full past month", () => {
    const { periodStart, periodEnd } = resolvePeriod("last_month", undefined, TODAY);
    expect(periodStart).toBe("2026-05-01");
    expect(periodEnd).toBe("2026-05-31");
  });

  it("quarter caps at today", () => {
    const { periodStart, periodEnd } = resolvePeriod("quarter", undefined, TODAY);
    expect(periodStart).toBe("2026-04-01");
    expect(periodEnd).toBe("2026-06-15");
  });

  it("year caps at today", () => {
    const { periodStart, periodEnd } = resolvePeriod("year", undefined, TODAY);
    expect(periodStart).toBe("2026-01-01");
    expect(periodEnd).toBe("2026-06-15");
  });

  it("custom range respects cap-at-today", () => {
    const { periodStart, periodEnd } = resolvePeriod(
      "custom",
      { periodStart: "2026-06-01", periodEnd: "2026-12-31" },
      TODAY
    );
    expect(periodStart).toBe("2026-06-01");
    expect(periodEnd).toBe("2026-06-15");
  });

  it("month-aligned defaults", () => {
    const d = monthAlignedDefaults(TODAY);
    expect(d.periodStart).toBe("2026-06-01");
    expect(d.periodEnd).toBe("2026-06-15");
  });
});

describe("formatPeriodLabel", () => {
  it("formats same-month range", () => {
    expect(formatPeriodLabel("2026-06-01", "2026-06-15")).toBe("1–15 June 2026");
  });
});
