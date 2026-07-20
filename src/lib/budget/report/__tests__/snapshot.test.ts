import { describe, expect, it } from "vitest";
import { buildReport } from "../aggregate";
import { previousCalendarMonthPeriod } from "../period";
import {
  computeStreaks,
  missionOutcome,
  snapshotFingerprint,
  snapshotMetricsOf,
} from "../snapshot";
import type { BudgetEntryInput, BudgetTargetInput, ReportSnapshotMetrics } from "../types";

const FIXED_AT = "2026-06-15T10:00:00.000Z";

function report(entries: BudgetEntryInput[], targets: BudgetTargetInput[] = []) {
  return buildReport(entries, targets, [], "2026-06-01", "2026-06-30", "Test User", FIXED_AT);
}

const BASE: BudgetEntryInput[] = [
  { type: "income", category: "salary", amount: 20000, entry_date: "2026-06-01" },
  { type: "expense", category: "food", amount: 4000, entry_date: "2026-06-05" },
  { type: "expense", category: "savings", amount: 3000, entry_date: "2026-06-03" },
];

function mkPrev(overrides: Partial<ReportSnapshotMetrics>): ReportSnapshotMetrics {
  return {
    healthScore: 70,
    healthBand: "Steady",
    verdict: "",
    savingsRatePct: 15,
    netCents: 100000,
    incomeCents: 2000000,
    consumptionCents: 400000,
    setAsideCents: 300000,
    unclassifiedPct: 0,
    debtSharePct: 0,
    budgetCoveredPct: 0,
    misalignedBudgetCount: 0,
    months: 1,
    topActionId: null,
    topActionTitle: null,
    trimCategoryMonthlyCents: null,
    fpCount: 0,
    fpSumCents: 0,
    fpMix: 0,
    ...overrides,
  };
}

describe("snapshotFingerprint", () => {
  it("is stable for identical inputs", () => {
    const a = snapshotFingerprint(BASE, [], "2026-06-01", "2026-06-30");
    const b = snapshotFingerprint([...BASE], [], "2026-06-01", "2026-06-30");
    expect(a).toEqual(b);
  });

  it("changes when an entry is RECATEGORISED in place (count+sum identical)", () => {
    const recategorised = BASE.map((e) =>
      e.category === "food" ? { ...e, category: "transport" } : e
    );
    const a = snapshotFingerprint(BASE, [], "2026-06-01", "2026-06-30");
    const b = snapshotFingerprint(recategorised, [], "2026-06-01", "2026-06-30");
    expect(b.fpCount).toBe(a.fpCount);
    expect(b.fpSumCents).toBe(a.fpSumCents);
    expect(b.fpMix).not.toBe(a.fpMix);
  });

  it("changes when an amount changes or a budget target changes", () => {
    const a = snapshotFingerprint(BASE, [], "2026-06-01", "2026-06-30");
    const amountChanged = BASE.map((e) => (e.category === "food" ? { ...e, amount: 4100 } : e));
    expect(snapshotFingerprint(amountChanged, [], "2026-06-01", "2026-06-30").fpSumCents).not.toBe(a.fpSumCents);
    const withTarget = snapshotFingerprint(BASE, [{ category: "food", monthly_limit: 4500, month_year: "2026-06" }], "2026-06-01", "2026-06-30");
    expect(withTarget.fpCount).toBe(a.fpCount + 1);
    expect(withTarget.fpMix).not.toBe(a.fpMix);
  });

  it("ignores targets for months outside the period and transfer entries", () => {
    const a = snapshotFingerprint(BASE, [{ category: "food", monthly_limit: 4500, month_year: "2026-01" }], "2026-06-01", "2026-06-30");
    const b = snapshotFingerprint(
      [...BASE, { type: "expense", category: "food", amount: 999, entry_date: "2026-06-10", is_transfer: true }],
      [],
      "2026-06-01",
      "2026-06-30"
    );
    const base = snapshotFingerprint(BASE, [], "2026-06-01", "2026-06-30");
    expect(a).toEqual(base);
    expect(b).toEqual(base);
  });
});

describe("snapshotMetricsOf", () => {
  it("captures the model's headline metrics and top action", () => {
    const model = report(BASE);
    const m = snapshotMetricsOf(model, BASE, []);
    expect(m.healthScore).toBe(model.insights.healthScore);
    expect(m.savingsRatePct).toBe(model.savingsRatePct);
    expect(m.netCents).toBe(model.netCents);
    expect(m.topActionId).toBe(model.insights.actions[0].id);
    expect(m.fpCount).toBeGreaterThan(0);
  });

  it("stores the trim baseline when the top action is a trim", () => {
    const model = report(BASE);
    const trim = model.insights.actions.find((a) => a.id.startsWith("trim-"));
    if (trim) {
      // Force the trim action to be the one recorded.
      const forced = {
        ...model,
        insights: { ...model.insights, actions: [{ ...trim, isTopPriority: true }] },
      };
      const m = snapshotMetricsOf(forced, BASE, []);
      expect(m.trimCategoryMonthlyCents).not.toBeNull();
    }
  });
});

describe("missionOutcome", () => {
  it("null without a previous snapshot or top action", () => {
    const model = report(BASE);
    expect(missionOutcome(null, model)).toBeNull();
    expect(missionOutcome(mkPrev({ topActionId: null }), model)).toBeNull();
  });

  it("recategorise: done when unclassified spend fell meaningfully", () => {
    const model = report(BASE); // no unclassified spend at all
    const out = missionOutcome(
      mkPrev({ topActionId: "recategorise", topActionTitle: "Recategorise your 'Other' transactions", unclassifiedPct: 34 }),
      model
    );
    expect(out?.status).toBe("done");
    expect(out?.detail).toContain("34%");
  });

  it("recategorise: still open when unclassified spend stayed high", () => {
    const entries: BudgetEntryInput[] = [
      { type: "income", category: "salary", amount: 10000, entry_date: "2026-06-01" },
      { type: "expense", category: "other", amount: 4000, entry_date: "2026-06-05" },
      { type: "expense", category: "food", amount: 4000, entry_date: "2026-06-06" },
    ];
    const model = report(entries); // 50% unclassified
    const out = missionOutcome(
      mkPrev({ topActionId: "recategorise", topActionTitle: "Recategorise", unclassifiedPct: 52 }),
      model
    );
    expect(out?.status).toBe("open");
  });

  it("trim: compares the category's per-month spend against the stored baseline", () => {
    const model = report(BASE); // food R4 000/month
    const done = missionOutcome(
      mkPrev({ topActionId: "trim-food", topActionTitle: "Trim Food & Groceries by 10%", trimCategoryMonthlyCents: 450000 }),
      model
    );
    expect(done?.status).toBe("done"); // 4000 <= 95% of 4500
    const open = missionOutcome(
      mkPrev({ topActionId: "trim-food", topActionTitle: "Trim Food & Groceries by 10%", trimCategoryMonthlyCents: 410000 }),
      model
    );
    expect(open?.status).toBe("open"); // 4000 > 95% of 4100 (= 3895)
  });

  it("keep-streak: done in the green, open in the red", () => {
    const green = report(BASE);
    expect(missionOutcome(mkPrev({ topActionId: "keep-streak", topActionTitle: "Keep the streak going" }), green)?.status).toBe("done");
    const red = report([
      { type: "income", category: "salary", amount: 1000, entry_date: "2026-06-01" },
      { type: "expense", category: "food", amount: 4000, entry_date: "2026-06-05" },
    ]);
    expect(missionOutcome(mkPrev({ topActionId: "keep-streak", topActionTitle: "Keep the streak going" }), red)?.status).toBe("open");
  });

  it("unmeasurable actions say so instead of guessing", () => {
    const model = report(BASE);
    expect(missionOutcome(mkPrev({ topActionId: "map-debts", topActionTitle: "Map out your debts" }), model)?.status).toBe("unmeasured");
    expect(missionOutcome(mkPrev({ topActionId: "something-new", topActionTitle: "?" }), model)?.status).toBe("unmeasured");
  });
});

describe("previousCalendarMonthPeriod", () => {
  it("maps any period start to the full previous calendar month", () => {
    expect(previousCalendarMonthPeriod("2026-07-01")).toEqual({ periodStart: "2026-06-01", periodEnd: "2026-06-30" });
    expect(previousCalendarMonthPeriod("2026-07-18")).toEqual({ periodStart: "2026-06-01", periodEnd: "2026-06-30" });
  });

  it("handles year and February boundaries", () => {
    expect(previousCalendarMonthPeriod("2026-01-15")).toEqual({ periodStart: "2025-12-01", periodEnd: "2025-12-31" });
    expect(previousCalendarMonthPeriod("2026-03-05")).toEqual({ periodStart: "2026-02-01", periodEnd: "2026-02-28" });
  });
});

describe("computeStreaks", () => {
  const H = (monthYear: string, healthScore: number, netCents: number) => ({ monthYear, healthScore, netCents });

  it("counts trailing green months and score rises over complete months", () => {
    const history = [
      H("2026-01", 60, 5000),
      H("2026-02", 65, 8000),
      H("2026-03", 55, -2000),
      H("2026-04", 60, 3000),
      H("2026-05", 66, 4000),
    ];
    const s = computeStreaks(history, "2026-06");
    expect(s.greenMonths).toBe(2); // May, Apr (Mar was red)
    expect(s.scoreUps).toBe(2); // 66>60, 60>55, then 55<65 breaks
  });

  it("excludes the in-progress month", () => {
    const history = [H("2026-04", 60, 3000), H("2026-05", 66, 4000), H("2026-06", 10, -99999)];
    const s = computeStreaks(history, "2026-06");
    expect(s.greenMonths).toBe(2);
  });

  it("empty history: no streaks", () => {
    expect(computeStreaks([], "2026-06")).toEqual({ greenMonths: 0, scoreUps: 0 });
  });
});
