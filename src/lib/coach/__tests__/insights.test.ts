import { describe, it, expect } from "vitest";
import { computeCoachInsights, formatRand, type CoachInput } from "../insights";

const base: Omit<CoachInput, "entries" | "budgets"> = {
  monthKey: "2026-07",
  prevMonthKey: "2026-06",
  categoryLabels: { food: "Food & Groceries", debt: "Debt Repayments", savings: "Savings", airtime: "Airtime & Data" },
  dayOfMonth: 15,
  daysInMonth: 31,
};

function entry(type: "income" | "expense", category: string, amount: number, date = "2026-07-10") {
  return { type, category, amount, entry_date: date };
}

describe("formatRand", () => {
  it("formats with thousand spaces", () => {
    expect(formatRand(840)).toBe("R840");
    expect(formatRand(12345)).toBe("R12 345");
    expect(formatRand(1234567.89)).toBe("R1 234 568");
  });
});

describe("computeCoachInsights", () => {
  it("returns nothing for empty data", () => {
    expect(computeCoachInsights({ ...base, entries: [], budgets: {} })).toEqual([]);
  });

  it("flags an exceeded budget with an alert and a lesson link", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [entry("expense", "food", 1200)],
      budgets: { food: 1000 },
    });
    const alert = out.find((i) => i.id === "over-budget:food:2026-07");
    expect(alert).toBeDefined();
    expect(alert!.severity).toBe("alert");
    expect(alert!.body).toContain("R1 200");
    expect(alert!.body).toContain("R1 000");
    expect(alert!.body).toContain("120%");
    expect(alert!.lesson?.courseId).toBe("money-basics");
  });

  it("warns at 80-99% of budget", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [entry("expense", "food", 850)],
      budgets: { food: 1000 },
    });
    const warn = out.find((i) => i.id === "near-budget:food:2026-07");
    expect(warn).toBeDefined();
    expect(warn!.severity).toBe("warn");
  });

  it("ignores immaterial amounts", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [entry("expense", "food", 100)],
      budgets: { food: 50 },
    });
    expect(out.find((i) => i.id.startsWith("over-budget"))).toBeUndefined();
  });

  it("excludes transfers from spend", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [{ ...entry("expense", "food", 5000), is_transfer: true }],
      budgets: { food: 1000 },
    });
    expect(out.find((i) => i.id.startsWith("over-budget"))).toBeUndefined();
  });

  it("detects a month-over-month spike, pace-adjusted", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [
        entry("expense", "airtime", 900, "2026-07-10"),
        entry("expense", "airtime", 400, "2026-06-15"),
      ],
      budgets: {},
    });
    // 900 spent by mid-month vs 400×(15/31)≈194 at same pace → ratio ≈ 4.6
    const spike = out.find((i) => i.id === "spike:airtime:2026-07");
    expect(spike).toBeDefined();
    expect(spike!.body).toContain("R900");
    expect(spike!.body).toContain("R400");
  });

  it("nudges on low savings rate only past mid-month", () => {
    const entries = [entry("income", "salary", 10000), entry("expense", "food", 300)];
    const early = computeCoachInsights({ ...base, dayOfMonth: 5, entries, budgets: {} });
    expect(early.find((i) => i.id.startsWith("savings-low"))).toBeUndefined();

    const late = computeCoachInsights({ ...base, dayOfMonth: 20, entries, budgets: {} });
    const nudge = late.find((i) => i.id === "savings-low:2026-07");
    expect(nudge).toBeDefined();
    expect(nudge!.lesson?.courseId).toBe("emergency-fund");
  });

  it("praises a 20%+ savings rate", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [entry("income", "salary", 10000), entry("expense", "savings", 2500)],
      budgets: {},
    });
    const praise = out.find((i) => i.id === "savings-praise:2026-07");
    expect(praise).toBeDefined();
    expect(praise!.severity).toBe("praise");
    expect(praise!.title).toContain("25%");
  });

  it("suggests setting budgets when spending is tracked without any", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [entry("expense", "food", 500)],
      budgets: {},
    });
    const nudge = out.find((i) => i.id === "no-budget:2026-07");
    expect(nudge).toBeDefined();
    expect(nudge!.lesson?.lessonId).toBe("lesson-3");
  });

  it("flags heavy debt load relative to income", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [entry("income", "salary", 10000), entry("expense", "debt", 3500)],
      budgets: {},
    });
    const debt = out.find((i) => i.id === "debt-load:2026-07");
    expect(debt).toBeDefined();
    expect(debt!.title).toContain("35%");
    expect(debt!.lesson?.courseId).toBe("credit-debt");
  });

  it("praises when all budgets are on track late in the month", () => {
    const out = computeCoachInsights({
      ...base,
      dayOfMonth: 27,
      entries: [entry("expense", "food", 400), entry("expense", "airtime", 100)],
      budgets: { food: 1000, airtime: 300 },
    });
    expect(out.find((i) => i.id === "on-track:2026-07")).toBeDefined();
  });

  it("sorts alerts before warnings before info", () => {
    const out = computeCoachInsights({
      ...base,
      entries: [
        entry("expense", "food", 1500),
        entry("expense", "airtime", 260),
        entry("income", "salary", 10000),
      ],
      budgets: { food: 1000, airtime: 300 },
    });
    expect(out[0].severity).toBe("alert");
  });

  it("never emits product recommendations (FAIS guard)", () => {
    const out = computeCoachInsights({
      ...base,
      dayOfMonth: 27,
      entries: [
        entry("income", "salary", 20000),
        entry("expense", "food", 1500),
        entry("expense", "debt", 8000),
        entry("expense", "savings", 100),
        entry("expense", "airtime", 900),
        entry("expense", "airtime", 300, "2026-06-10"),
      ],
      budgets: { food: 1000, airtime: 300 },
    });
    const text = out.map((i) => `${i.title} ${i.body}`).join(" ").toLowerCase();
    for (const banned of ["you should buy", "you should invest", "you should switch", "we recommend", "capitec", "fnb", "tymebank", "easyequities", "satrix"]) {
      expect(text).not.toContain(banned);
    }
  });
});
