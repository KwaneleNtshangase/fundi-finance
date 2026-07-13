import { describe, expect, it } from "vitest";
import {
  levenshtein,
  simpleStem,
  buildSearchIndex,
  fuzzySearch,
  getSuggestion,
} from "../fuzzySearch";
import type { Course } from "@/data/content";
import type { Concept } from "@/data/concepts";

// ─── Levenshtein ─────────────────────────────────────────────────────────────

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("budget", "budget")).toBe(0);
  });

  it("returns correct distance for single substitution", () => {
    expect(levenshtein("budget", "buget")).toBe(1); // deletion
    expect(levenshtein("invest", "invst")).toBe(1);  // deletion
  });

  it("returns correct distance for transposition", () => {
    expect(levenshtein("invest", "invets")).toBe(2); // swap s↔t = 2 ops
  });

  it("returns length of other string when one is empty", () => {
    expect(levenshtein("", "abc")).toBe(3);
    expect(levenshtein("abc", "")).toBe(3);
  });

  it("handles case-sensitive comparison", () => {
    expect(levenshtein("Budget", "budget")).toBe(1); // B→b
  });

  it("respects maxDist early exit", () => {
    const dist = levenshtein("completely", "different", 2);
    expect(dist).toBeGreaterThan(2);
  });
});

// ─── simpleStem ──────────────────────────────────────────────────────────────

describe("simpleStem", () => {
  it("stems -ing suffix", () => {
    expect(simpleStem("investing")).toBe("invest");
    expect(simpleStem("saving")).toBe("sav");
  });

  it("stems -ment suffix", () => {
    expect(simpleStem("investment")).toBe("invest");
    expect(simpleStem("retirement")).toBe("retire");
  });

  it("stems -tion suffix", () => {
    expect(simpleStem("protection")).toBe("protect");
    expect(simpleStem("inflation")).toBe("inflat");
  });

  it("stems -s suffix", () => {
    expect(simpleStem("taxes")).toBe("taxe");
    expect(simpleStem("funds")).toBe("fund");
  });

  it("stems -ies to -y", () => {
    expect(simpleStem("strategies")).toBe("strategy");
  });

  it("stems -ness suffix", () => {
    expect(simpleStem("awareness")).toBe("aware");
  });

  it("does not stem words that are too short", () => {
    expect(simpleStem("tax")).toBe("tax");
    expect(simpleStem("is")).toBe("is");
  });

  it("applies only the first matching rule", () => {
    // "budgeting" → -ing removes → "budget" (not -ting)
    expect(simpleStem("budgeting")).toBe("budget");
  });

  it("does not produce stems shorter than 3 chars", () => {
    // "bled" → -ed → "bl" would be too short, so keep "bled"
    expect(simpleStem("bled")).toBe("bled");
  });
});

// ─── Test Fixtures ───────────────────────────────────────────────────────────

const MOCK_COURSES: Course[] = [
  {
    id: "money-basics",
    title: "Money Basics",
    description: "Master the fundamentals of personal finance, from inflation to budgeting",
    icon: "wallet",
    units: [],
  },
  {
    id: "investing-basics",
    title: "Investing Basics",
    description: "Learn how to invest in the JSE, ETFs, and build long-term wealth",
    icon: "trending-up",
    units: [],
  },
  {
    id: "credit-debt",
    title: "Credit & Debt",
    description: "Understand credit scores, manage debt, and avoid the debt trap",
    icon: "credit-card",
    units: [],
  },
  {
    id: "retirement",
    title: "Retirement Planning",
    description: "Build a retirement plan with pension funds, RAs, and compound growth",
    icon: "umbrella",
    units: [],
  },
];

const MOCK_CONCEPTS: Concept[] = [
  {
    id: "compound-interest",
    name: "Compound Interest",
    category: "Money & Economics",
    reviewCard: {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correct: 0,
      explanation: "Test",
    },
    courses: ["money-basics", "investing-basics"],
  },
  {
    id: "credit-score",
    name: "Credit Score",
    category: "Debt & Credit",
    reviewCard: {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correct: 0,
      explanation: "Test",
    },
    courses: ["credit-debt"],
  },
  {
    id: "etf",
    name: "Exchange Traded Funds",
    category: "Investing",
    reviewCard: {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correct: 0,
      explanation: "Test",
    },
    courses: ["investing-basics"],
  },
  {
    id: "pension",
    name: "Pension Fund",
    category: "Retirement",
    reviewCard: {
      question: "Test?",
      options: ["A", "B", "C", "D"],
      correct: 0,
      explanation: "Test",
    },
    courses: ["retirement"],
  },
];

// ─── buildSearchIndex ────────────────────────────────────────────────────────

describe("buildSearchIndex", () => {
  it("creates an entry for each course", () => {
    const index = buildSearchIndex(MOCK_COURSES, MOCK_CONCEPTS);
    expect(index).toHaveLength(MOCK_COURSES.length);
  });

  it("tokenises title correctly", () => {
    const index = buildSearchIndex(MOCK_COURSES, MOCK_CONCEPTS);
    const investing = index.find(e => e.courseId === "investing-basics")!;
    expect(investing.titleTokens).toContain("invest");
    expect(investing.titleTokens).toContain("basic");
  });

  it("includes concept tags for linked courses", () => {
    const index = buildSearchIndex(MOCK_COURSES, MOCK_CONCEPTS);
    const investing = index.find(e => e.courseId === "investing-basics")!;
    // Should include "compound interest" concept name tokens (stemmed)
    expect(investing.tagTokens).toContain("compound");
    expect(investing.tagTokens).toContain("interest");
    // Should include "ETF" concept tokens
    expect(investing.tagTokens).toContain("exchange");
  });

  it("includes description tokens", () => {
    const index = buildSearchIndex(MOCK_COURSES, MOCK_CONCEPTS);
    const money = index.find(e => e.courseId === "money-basics")!;
    expect(money.descTokens).toContain("inflat");
    expect(money.descTokens).toContain("budget");
  });
});

// ─── fuzzySearch ─────────────────────────────────────────────────────────────

describe("fuzzySearch", () => {
  const index = buildSearchIndex(MOCK_COURSES, MOCK_CONCEPTS);

  it("returns empty array for empty query", () => {
    expect(fuzzySearch("", index)).toEqual([]);
    expect(fuzzySearch("   ", index)).toEqual([]);
  });

  it("finds exact title match", () => {
    const results = fuzzySearch("Money Basics", index);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].courseId).toBe("money-basics");
  });

  it("prefix matching: 'invest' returns investing-basics", () => {
    const results = fuzzySearch("invest", index);
    expect(results.length).toBeGreaterThan(0);
    const investResult = results.find(r => r.courseId === "investing-basics");
    expect(investResult).toBeDefined();
  });

  it("stemming: 'investing' returns investing-basics via title", () => {
    const results = fuzzySearch("investing", index);
    const investResult = results.find(r => r.courseId === "investing-basics");
    expect(investResult).toBeDefined();
  });

  it("stemming: 'investment' returns courses with invest stem", () => {
    const results = fuzzySearch("investment", index);
    expect(results.length).toBeGreaterThan(0);
    const courseIds = results.map(r => r.courseId);
    expect(courseIds).toContain("investing-basics");
  });

  it("typo tolerance (short word): 'buget' matches 'budget' (edit distance 1)", () => {
    const results = fuzzySearch("buget", index);
    expect(results.length).toBeGreaterThan(0);
    // money-basics has "budgeting" in its description
    const moneyResult = results.find(r => r.courseId === "money-basics");
    expect(moneyResult).toBeDefined();
  });

  it("typo tolerance (long word): 'investng' matches 'investing' (edit distance 1)", () => {
    const results = fuzzySearch("investng", index);
    expect(results.length).toBeGreaterThan(0);
  });

  it("field weight: title match ranks higher than description match", () => {
    // "credit" appears in credit-debt title AND money-basics description might not
    const results = fuzzySearch("credit", index);
    if (results.length >= 2) {
      const creditDebtIdx = results.findIndex(r => r.courseId === "credit-debt");
      expect(creditDebtIdx).toBe(0); // Should be first due to title weight
    }
  });

  it("concept tag matching: 'pension' returns retirement course", () => {
    const results = fuzzySearch("pension", index);
    expect(results.length).toBeGreaterThan(0);
    const retirementResult = results.find(r => r.courseId === "retirement");
    expect(retirementResult).toBeDefined();
  });

  it("returns results sorted by score descending", () => {
    const results = fuzzySearch("invest", index);
    for (let i = 1; i < results.length; i++) {
      expect(results[i].score).toBeLessThanOrEqual(results[i - 1].score);
    }
  });

  it("filters out results below minimum threshold", () => {
    const results = fuzzySearch("xyzzy", index);
    expect(results).toEqual([]); // No match for gibberish
  });
});

// ─── getSuggestion ───────────────────────────────────────────────────────────

describe("getSuggestion", () => {
  const index = buildSearchIndex(MOCK_COURSES, MOCK_CONCEPTS);

  it("returns null when query already has results", () => {
    // "invest" has results, so getSuggestion should not be called with it
    // but if called directly, it should still find a suggestion or null
    const suggestion = getSuggestion("invest", index);
    // "invest" exists in vocab, so no correction needed → null
    expect(suggestion).toBeNull();
  });

  it("suggests a correction for a misspelt word", () => {
    const suggestion = getSuggestion("investmant", index);
    // Should suggest "investment" or similar
    expect(suggestion).not.toBeNull();
    expect(suggestion).toContain("invest");
  });

  it("returns null for completely unrecognisable input", () => {
    const suggestion = getSuggestion("zzzzzzzzzzzzzzz", index);
    // Too far from any word in vocab
    expect(suggestion).toBeNull();
  });

  it("preserves correct tokens and only corrects misspelt ones", () => {
    const suggestion = getSuggestion("money basecs", index);
    expect(suggestion).not.toBeNull();
    if (suggestion) {
      expect(suggestion).toContain("money");
      expect(suggestion).toContain("basic"); // corrected from "basecs"
    }
  });
});
