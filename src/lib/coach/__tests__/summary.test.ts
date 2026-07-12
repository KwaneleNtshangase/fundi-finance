import { describe, it, expect } from "vitest";
import { buildCoachSummary } from "../summary";
import type { CoachInput } from "../insights";

const base: Omit<CoachInput, "entries" | "budgets"> = {
  monthKey: "2026-07",
  prevMonthKey: "2026-06",
  categoryLabels: { food: "Food & Groceries", savings: "Savings" },
  dayOfMonth: 12,
  daysInMonth: 31,
};

describe("buildCoachSummary", () => {
  it("reports no data for an empty month", () => {
    const s = buildCoachSummary({ ...base, entries: [], budgets: {} });
    expect(s.hasData).toBe(false);
  });

  it("includes totals, budgets and percentages", () => {
    const s = buildCoachSummary({
      ...base,
      entries: [
        { type: "income", category: "salary", amount: 10000, entry_date: "2026-07-01" },
        { type: "expense", category: "food", amount: 1200, entry_date: "2026-07-05" },
        { type: "expense", category: "food", amount: 800, entry_date: "2026-06-15" },
        { type: "expense", category: "savings", amount: 2000, entry_date: "2026-07-02" },
      ],
      budgets: { food: 1500 },
    });
    expect(s.hasData).toBe(true);
    expect(s.text).toContain("Income this month: R10 000");
    expect(s.text).toContain("Food & Groceries: R1 200 | R1 500 | 80% | R800");
    expect(s.text).toContain("Savings rate: 20% of income (R2 000)");
  });

  it("NEVER leaks descriptions, merchants, or identity fields (POPIA guard)", () => {
    const entries = [
      { type: "expense" as const, category: "food", amount: 500, entry_date: "2026-07-03" },
      { type: "income" as const, category: "salary", amount: 9000, entry_date: "2026-07-01" },
    ];
    // Simulate the caller accidentally passing rows carrying extra fields:
    const dirty = entries.map((e) => ({
      ...e,
      description: "WOOLWORTHS SANDTON CARD 1234",
      user_id: "9c1e6a2f-user-uuid",
      email: "someone@example.com",
      account: "FNB Cheque 62001234567",
    }));
    const s = buildCoachSummary({ ...base, entries: dirty, budgets: {} });
    for (const banned of ["WOOLWORTHS", "SANDTON", "1234", "9c1e6a2f", "someone@example.com", "FNB", "62001234567", "@"]) {
      expect(s.text).not.toContain(banned);
    }
  });

  it("excludes transfers", () => {
    const s = buildCoachSummary({
      ...base,
      entries: [
        { type: "expense", category: "food", amount: 500, entry_date: "2026-07-03" },
        { type: "expense", category: "food", amount: 9999, entry_date: "2026-07-03", is_transfer: true },
      ],
      budgets: {},
    });
    expect(s.text).toContain("R500");
    expect(s.text).not.toContain("9 999");
  });

  it("embeds rules-engine findings for grounding", () => {
    const s = buildCoachSummary({
      ...base,
      entries: [{ type: "expense", category: "food", amount: 2000, entry_date: "2026-07-03" }],
      budgets: { food: 1000 },
    });
    expect(s.text).toContain("Current coach findings:");
    expect(s.text).toContain("[alert] Food & Groceries is over budget");
  });
});
