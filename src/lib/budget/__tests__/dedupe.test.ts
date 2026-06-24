import { describe, expect, it } from "vitest";
import { assignDedupeHashes, buildDedupeHash, dedupeTupleKey } from "../dedupe";
import { reconcileAfterImportSkips } from "../reconciliation";
import { isRefundLikeCredit } from "../refunds";
import { txnToBudgetEntryFields } from "../types";

describe("dedupe hash", () => {
  it("differentiates same amount/description via balanceAfter", () => {
    const base = {
      date: "2026-05-01",
      description: "COFFEE SHOP",
      amountZAR: -30,
      rawMerchant: "COFFEE SHOP",
      lineIndex: 0,
    };
    const a = buildDedupeHash({ ...base, balanceAfter: 1000 }, 1);
    const b = buildDedupeHash({ ...base, balanceAfter: 970, lineIndex: 1 }, 1);
    expect(a).not.toBe(b);
  });

  it("assigns occurrence ordinals when no balance or FITID", () => {
    const base = {
      date: "2026-05-01",
      description: "COFFEE SHOP",
      amountZAR: -30,
      rawMerchant: "COFFEE SHOP",
      lineIndex: 0,
    };
    const second = { ...base, lineIndex: 1 };
    const hashes = assignDedupeHashes([base, second]);
    expect(hashes[0]).not.toBe(hashes[1]);
    expect(hashes[0]).toContain("occ:1");
    expect(hashes[1]).toContain("occ:2");
    expect(dedupeTupleKey(base)).toBe(dedupeTupleKey(second));
  });

  it("uses FITID when present instead of occurrence", () => {
    const txn = {
      date: "2026-05-01",
      description: "COFFEE SHOP",
      amountZAR: -30,
      rawMerchant: "COFFEE SHOP",
      externalId: "fit-99",
      lineIndex: 0,
    };
    expect(buildDedupeHash(txn, 1)).toContain("id:fit-99");
    expect(buildDedupeHash(txn, 1)).not.toContain("occ:");
  });
});

describe("reconcile after import skips", () => {
  const txns = [
    { date: "2026-05-01", description: "A", amountZAR: -100, rawMerchant: "A", lineIndex: 0 },
    { date: "2026-05-02", description: "B", amountZAR: 50, rawMerchant: "B", lineIndex: 1 },
  ];
  const statement = {
    ok: true,
    parsedCount: 2,
    parsedSignedSumCents: -5000,
    warnings: [] as string[],
  };

  it("passes when all rows import", () => {
    const rows = txns.map((t) => ({ ...t, amountZAR: t.amountZAR }));
    const result = reconcileAfterImportSkips(txns, rows, statement);
    expect(result.ok).toBe(true);
  });

  it("fails when statement total no longer matches parsed file after skips", () => {
    const rows = [
      { amountZAR: -100 },
      { amountZAR: 50, skipReason: "existing_import" as const },
    ];
    const badStatement = { ...statement, parsedSignedSumCents: -9999 };
    const result = reconcileAfterImportSkips(txns, rows, badStatement);
    expect(result.ok).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
  });
});

describe("refund detection", () => {
  it("flags positive refund-like lines", () => {
    expect(isRefundLikeCredit({ amountZAR: 30, description: "CARD REFUND WOOLWORTHS" })).toBe(true);
    expect(isRefundLikeCredit({ amountZAR: -30, description: "CARD REFUND" })).toBe(false);
    expect(isRefundLikeCredit({ amountZAR: 5000, description: "SALARY" })).toBe(false);
  });
});

describe("sign convention", () => {
  it("maps negative to expense with positive amount", () => {
    const { type, amount } = txnToBudgetEntryFields({ amountZAR: -150.5 });
    expect(type).toBe("expense");
    expect(amount).toBe(150.5);
  });

  it("maps positive to income", () => {
    const { type, amount } = txnToBudgetEntryFields({ amountZAR: 15000 });
    expect(type).toBe("income");
    expect(amount).toBe(15000);
  });

  it("maps zero to income (edge case)", () => {
    const { type, amount } = txnToBudgetEntryFields({ amountZAR: 0 });
    expect(type).toBe("income");
    expect(amount).toBe(0);
  });
});
