import { describe, expect, it } from "vitest";
import { computeBehaviour } from "../behaviour";
import type { BudgetEntryInput } from "../types";

function exp(category: string, amount: number, entry_date: string, description = ""): BudgetEntryInput {
  return { type: "expense", category, amount, entry_date, description };
}
function inc(category: string, amount: number, entry_date: string): BudgetEntryInput {
  return { type: "income", category, amount, entry_date };
}

describe("computeBehaviour gating", () => {
  it("one month of data: no patterns, no personality", () => {
    const entries = [
      inc("salary", 10000, "2026-06-25"),
      exp("food", 3000, "2026-06-26"),
      exp("savings", 2000, "2026-06-26"),
    ];
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-06-01" });
    expect(b.monthsAnalysed).toBe(1);
    expect(b.patterns).toEqual([]);
    expect(b.personality).toBeNull();
  });

  it("months truncated by the window are not analysed", () => {
    const entries = [
      inc("salary", 10000, "2026-06-25"),
      exp("food", 3000, "2026-06-26"),
    ];
    // Window starts mid-June: June's data is cut off and must not count.
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-06-15" });
    expect(b.monthsAnalysed).toBe(0);
  });

  it("the partial current month is excluded", () => {
    const entries = [
      inc("salary", 10000, "2026-05-25"),
      exp("food", 3000, "2026-05-26"),
      inc("salary", 10000, "2026-06-25"),
      exp("food", 3000, "2026-06-26"),
    ];
    // endDate mid-June: June is incomplete.
    const b = computeBehaviour(entries, [], "2026-06-28", { windowStart: "2026-05-01" });
    expect(b.monthsAnalysed).toBe(1);
  });

  it("transfers are ignored", () => {
    const entries = [
      { ...exp("food", 5000, "2026-06-10"), is_transfer: true },
      inc("salary", 10000, "2026-06-25"),
    ];
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-06-01" });
    expect(b.monthsAnalysed).toBe(1); // month counts via the salary entry only
  });
});

describe("pattern detectors", () => {
  it("detects pay-yourself-first (save within days of payday)", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-03", "2026-04", "2026-05", "2026-06"]) {
      entries.push(inc("salary", 10000, `${m}-25`));
      entries.push(exp("savings", 2000, `${m}-26`));
      entries.push(exp("food", 3000, `${m}-10`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-03-01" });
    const p = b.patterns.find((x) => x.id === "payday-saver");
    expect(p).toBeTruthy();
    expect(p!.tone).toBe("good");
  });

  it("detects leftover saving (set-aside long after income)", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-04", "2026-05", "2026-06"]) {
      entries.push(inc("salary", 10000, `${m}-01`));
      entries.push(exp("savings", 500, `${m}-28`));
      entries.push(exp("food", 3000, `${m}-10`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-04-01" });
    const p = b.patterns.find((x) => x.id === "leftover-saver");
    expect(p).toBeTruthy();
    expect(p!.tone).toBe("warn");
  });

  it("detects weekday concentration with enough transactions", () => {
    const entries: BudgetEntryInput[] = [];
    // June 2026 Fridays: 5, 12, 19, 26 · July 2026 Fridays: 3, 10, 17, 24, 31.
    for (const d of ["2026-06-05", "2026-06-12", "2026-06-19", "2026-06-26", "2026-07-03", "2026-07-10", "2026-07-17", "2026-07-24"]) {
      entries.push(exp("entertainment", 1000, d, "Friday groove"));
    }
    // 24 small weekday (Mon-Wed) transactions to clear the ≥30 txn gate.
    for (const m of ["2026-06", "2026-07"]) {
      for (const day of ["01", "02", "03", "08", "09", "15", "16", "22", "23", "29", "06", "13"]) {
        entries.push(exp("food", 100, `${m}-${day}`));
      }
    }
    entries.push(inc("salary", 20000, "2026-06-25"), inc("salary", 20000, "2026-07-25"));
    const b = computeBehaviour(entries, [], "2026-07-31", { windowStart: "2026-06-01" });
    const p = b.patterns.find((x) => x.id === "weekday");
    expect(p).toBeTruthy();
    expect(p!.title).toContain("Friday");
  });

  it("detects a month-end spending spike", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-05", "2026-06"]) {
      for (const day of ["05", "10", "15", "20"]) entries.push(exp("food", 100, `${m}-${day}`));
      entries.push(exp("entertainment", 1500, `${m}-28`));
      entries.push(exp("food", 800, `${m}-29`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-05-01" });
    const p = b.patterns.find((x) => x.id === "monthend");
    expect(p).toBeTruthy();
  });

  it("flags the most volatile material category", () => {
    const entries: BudgetEntryInput[] = [
      inc("salary", 10000, "2026-04-01"),
      inc("salary", 10000, "2026-05-01"),
      inc("salary", 10000, "2026-06-01"),
      exp("transport", 600, "2026-04-10"),
      exp("transport", 2400, "2026-05-10"),
      exp("transport", 600, "2026-06-10"),
      exp("food", 2000, "2026-04-15"),
      exp("food", 2000, "2026-05-15"),
      exp("food", 2000, "2026-06-15"),
    ];
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-04-01" });
    const p = b.patterns.find((x) => x.id === "volatile-transport");
    expect(p).toBeTruthy();
    // Steady food must NOT be flagged.
    expect(b.patterns.find((x) => x.id === "volatile-food")).toBeUndefined();
  });

  it("finds subscription-style recurring wants", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-04", "2026-05", "2026-06"]) {
      entries.push(exp("entertainment", 199, `${m}-03`, "Netflix"));
      entries.push(exp("entertainment", 450, `${m}-05`, "DSTV Subscription"));
      entries.push(exp("food", 2000, `${m}-10`));
      entries.push(inc("salary", 10000, `${m}-01`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-04-01" });
    const p = b.patterns.find((x) => x.id === "subscriptions");
    expect(p).toBeTruthy();
    expect(p!.detail).toContain("Netflix");
  });

  it("links transport to business income when correlated", () => {
    const biz = [0, 5000, 0, 8000];
    const transport = [300, 1500, 350, 2200];
    const months = ["2026-03", "2026-04", "2026-05", "2026-06"];
    const entries: BudgetEntryInput[] = [];
    months.forEach((m, i) => {
      entries.push(inc("salary", 8000, `${m}-01`));
      if (biz[i] > 0) entries.push(inc("business", biz[i], `${m}-15`));
      entries.push(exp("transport", transport[i], `${m}-12`));
      entries.push(exp("food", 2000, `${m}-20`));
    });
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-03-01" });
    expect(b.patterns.find((x) => x.id === "hustle-transport")).toBeTruthy();
  });
});

describe("money personality", () => {
  it("Saver: 15%+ set aside in most earning months, with evidence", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-03", "2026-04", "2026-05", "2026-06"]) {
      entries.push(inc("salary", 10000, `${m}-25`));
      entries.push(exp("savings", 2000, `${m}-26`));
      entries.push(exp("food", 3000, `${m}-10`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-03-01" });
    expect(b.personality?.id).toBe("saver");
    expect(b.personality?.evidence.length).toBeGreaterThan(0);
  });

  it("Builder: heavy debt payoff without a high savings rate", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-04", "2026-05", "2026-06"]) {
      entries.push(inc("salary", 10000, `${m}-01`));
      entries.push(exp("debt", 2500, `${m}-02`));
      entries.push(exp("savings", 800, `${m}-03`));
      entries.push(exp("food", 3000, `${m}-10`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-04-01" });
    expect(b.personality?.id).toBe("builder");
  });

  it("Impulse Spender: lifestyle dominates and nothing positive fits", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-04", "2026-05", "2026-06"]) {
      entries.push(inc("salary", 10000, `${m}-01`));
      entries.push(exp("entertainment", 2500, `${m}-05`));
      entries.push(exp("food", 2500, `${m}-10`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-04-01" });
    expect(b.personality?.id).toBe("impulse");
  });

  it("no personality with fewer than 3 complete months", () => {
    const entries: BudgetEntryInput[] = [];
    for (const m of ["2026-05", "2026-06"]) {
      entries.push(inc("salary", 10000, `${m}-25`));
      entries.push(exp("savings", 2000, `${m}-26`));
    }
    const b = computeBehaviour(entries, [], "2026-06-30", { windowStart: "2026-05-01" });
    expect(b.personality).toBeNull();
  });
});
