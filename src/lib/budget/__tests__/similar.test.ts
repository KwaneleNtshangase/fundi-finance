import { describe, expect, it } from "vitest";
import { findSimilarEntries, merchantLabelFor, merchantPatternFor } from "../similar";

const base = { type: "expense" as const, category: "other" };

describe("findSimilarEntries", () => {
  const entries = [
    { id: "1", ...base, description: "DALITSO GROUP -15,000.00 ELECTRONIC BANKING PAYMENT FR" },
    { id: "2", ...base, description: "Dalitso Group-6,200.00 ELECT" },
    { id: "3", ...base, description: "FNB App Payment To dalitso group" },
    { id: "4", ...base, description: "Checkers Sixty60" },
    { id: "5", ...base, description: "Dalitso Group", is_transfer: true },
    { id: "6", type: "income" as const, category: "other-income", description: "Dalitso Group refundish" },
    { id: "7", ...base, category: "business-exp", description: "DALITSO GROUP ref 998877" },
  ];

  it("matches same merchant across raw string variants", () => {
    const similar = findSimilarEntries(entries, { id: "1", description: entries[0].description, type: "expense" }, "business-exp");
    // 2 and 3 match; 4 different merchant; 5 transfer; 6 wrong type;
    // 7 already in the target category.
    expect(similar.map((e) => e.id).sort()).toEqual(["2", "3"]);
  });

  it("returns nothing for unlabelled descriptions", () => {
    const similar = findSimilarEntries(entries, { id: "9", description: "", type: "expense" }, "food");
    expect(similar).toEqual([]);
  });
});

describe("merchantPatternFor", () => {
  it("produces the lowercase pattern used by the import pipeline", () => {
    expect(merchantPatternFor("DALITSO GROUP -15,000.00 ELECT")).toBe("dalitso group");
    expect(merchantPatternFor("")).toBeNull();
    expect(merchantPatternFor("-12,345.00")).toBeNull();
  });
});

describe("merchantLabelFor", () => {
  it("gives a display-ready name", () => {
    expect(merchantLabelFor("FNB App Payment To mama coka")).toBe("Mama Coka");
  });
});
