import type { NormalizedTxn, UserMerchantRule, CategoriseResult } from "../budget/types";
import { normaliseDescription } from "../budget/dedupe";

export type BuiltInRule = {
  pattern: RegExp;
  category: string;
  type: "income" | "expense";
};

/** SA merchant keyword rules — maps to existing BudgetPlanner category ids. */
export const BUILT_IN_RULES: BuiltInRule[] = [
  { pattern: /woolworths|checkers|pick n pay|shoprite|spar|boxer/i, category: "food", type: "expense" },
  { pattern: /uber|bolt|gautrain|petrol|engen|shell|sasol|bp /i, category: "transport", type: "expense" },
  { pattern: /vodacom|mtn|telkom|cell c|rain /i, category: "airtime", type: "expense" },
  { pattern: /netflix|dstv|showmax|spotify|steam/i, category: "entertainment", type: "expense" },
  { pattern: /fnb|capitec|nedbank|absa|standard bank|bank fee|service fee|monthly fee/i, category: "other", type: "expense" },
  { pattern: /rent|lease|landlord|body corporate|rates/i, category: "housing", type: "expense" },
  { pattern: /salary|wages|payroll|stipend/i, category: "salary", type: "income" },
  { pattern: /interest|refund|cashback/i, category: "other-income", type: "income" },
];

const UNCATEGORISED_EXPENSE = "other";
const UNCATEGORISED_INCOME = "other-income";

function matchBuiltIn(text: string): CategoriseResult | null {
  for (const rule of BUILT_IN_RULES) {
    if (rule.pattern.test(text)) {
      return { category: rule.category, type: rule.type, confidence: 0.85, source: "rule" };
    }
  }
  return null;
}

function matchUserRule(
  text: string,
  userRules: UserMerchantRule[]
): CategoriseResult | null {
  const norm = normaliseDescription(text);
  for (const rule of userRules) {
    const pat = rule.merchant_pattern.toLowerCase();
    if (norm.includes(pat) || text.toLowerCase().includes(pat)) {
      return {
        category: rule.category,
        type: rule.type,
        confidence: 0.95,
        source: "user",
      };
    }
  }
  return null;
}

export function categorise(
  txn: NormalizedTxn,
  userRules: UserMerchantRule[] = []
): CategoriseResult {
  const haystack = `${txn.rawMerchant} ${txn.description}`;

  // The SIGN of the amount is authoritative for income vs expense. Descriptions
  // routinely contain bank/merchant words that don't reflect direction (e.g. an
  // FNB credit "FNB OB Pmt ..."), so a keyword rule may only set the CATEGORY —
  // it can never flip the direction. A rule whose type contradicts the sign is
  // ignored, and the row falls back to the correct uncategorised bucket.
  const type: "income" | "expense" = txn.amountZAR >= 0 ? "income" : "expense";

  const userMatch = matchUserRule(haystack, userRules);
  if (userMatch && userMatch.type === type) return userMatch;

  const builtIn = matchBuiltIn(haystack);
  if (builtIn && builtIn.type === type) return builtIn;

  return {
    category: type === "income" ? UNCATEGORISED_INCOME : UNCATEGORISED_EXPENSE,
    type,
    confidence: 0.2,
    source: "uncategorised",
  };
}
