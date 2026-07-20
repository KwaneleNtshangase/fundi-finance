import { describe, expect, it } from "vitest";
import { categorise } from "../index";
import type { NormalizedTxn } from "@/lib/budget/types";

const txn = (overrides: Partial<NormalizedTxn>): NormalizedTxn => ({
  date: "2026-05-01",
  description: "",
  amountZAR: -100,
  rawMerchant: "",
  lineIndex: 0,
  ...overrides,
});

describe("categorise", () => {
  it("matches Woolworths to food", () => {
    const r = categorise(txn({ description: "WOOLWORTHS SANDTON", rawMerchant: "WOOLWORTHS" }));
    expect(r.category).toBe("food");
    expect(r.source).toBe("rule");
  });

  it("user rules outrank built-in", () => {
    const r = categorise(
      txn({ description: "WOOLWORTHS CORPORATE", rawMerchant: "WOOLWORTHS" }),
      [{ merchant_pattern: "woolworths", category: "education", type: "expense" }]
    );
    expect(r.category).toBe("education");
    expect(r.source).toBe("user");
  });

  it("defaults uncategorised expense to other", () => {
    const r = categorise(txn({ description: "XYZ UNKNOWN MERCHANT", rawMerchant: "XYZ" }));
    expect(r.category).toBe("other");
    expect(r.source).toBe("uncategorised");
  });
});
