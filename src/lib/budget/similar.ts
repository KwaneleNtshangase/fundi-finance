/**
 * Similar-transaction matching for the "apply category to similar" flow.
 *
 * Two transactions are "similar" when their cleaned merchant identity
 * (merchantKey) matches - the same logic the report uses to group
 * "FNB App Payment To Mama Coka" with "mama coka-500.00 Fee: Payshap".
 */
import { cleanMerchantName, merchantKey } from "./report/merchants";

export type SimilarMatchable = {
  id: string;
  type: "income" | "expense";
  category: string;
  description?: string | null;
  is_transfer?: boolean;
};

/**
 * Entries that share the edited entry's merchant identity and would change
 * category. Transfers and the edited row itself are excluded.
 */
export function findSimilarEntries<T extends SimilarMatchable>(
  entries: T[],
  edited: { id: string; description?: string | null; type: "income" | "expense" },
  newCategory: string
): T[] {
  const key = merchantKey(edited.description);
  if (!key || key === "unlabelled") return [];
  return entries.filter(
    (e) =>
      e.id !== edited.id &&
      !e.is_transfer &&
      e.type === edited.type &&
      e.category !== newCategory &&
      merchantKey(e.description) === key
  );
}

/**
 * The stored merchant rule pattern for a description, matching the format the
 * import pipeline uses (lowercase substring checked against the normalised
 * description). Null when there's nothing usable to match on.
 */
export function merchantPatternFor(description?: string | null): string | null {
  const key = merchantKey(description);
  return !key || key === "unlabelled" ? null : key;
}

/** Display-ready merchant name for the confirmation modal title. */
export function merchantLabelFor(description?: string | null): string {
  return cleanMerchantName(description, 40);
}
