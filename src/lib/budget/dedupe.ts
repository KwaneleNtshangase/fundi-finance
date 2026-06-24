import type { NormalizedTxn } from "./types";

/** Normalise description for hashing / merchant matching. */
export function normaliseDescription(desc: string): string {
  return desc
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

export function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

/** Base tuple for occurrence counting within a single statement. */
export function dedupeTupleKey(
  txn: Pick<NormalizedTxn, "date" | "amountZAR" | "description">
): string {
  return [
    txn.date,
    String(amountToCents(txn.amountZAR)),
    normaliseDescription(txn.description),
  ].join("|");
}

/**
 * Per-transaction dedupe fingerprint.
 * - With running balance: date | amountCents | normDesc | balanceAfterCents
 * - With OFX FITID: … | id:FITID
 * - Otherwise: … | occ:N (N = 1st/2nd/3rd identical tuple in this file)
 */
export function buildDedupeHash(txn: NormalizedTxn, occurrenceOrdinal: number): string {
  const parts = [
    txn.date,
    String(amountToCents(txn.amountZAR)),
    normaliseDescription(txn.description),
  ];

  if (txn.balanceAfter !== undefined && txn.balanceAfter !== null) {
    parts.push(`bal:${amountToCents(txn.balanceAfter)}`);
  } else if (txn.externalId) {
    parts.push(`id:${txn.externalId}`);
  } else {
    parts.push(`occ:${occurrenceOrdinal}`);
  }

  return parts.join("|");
}

/** Assign stable dedupe hashes to all rows in parse order. */
export function assignDedupeHashes(transactions: NormalizedTxn[]): string[] {
  const tupleCounts = new Map<string, number>();
  return transactions.map((txn) => {
    const tupleKey = dedupeTupleKey(txn);
    const ordinal = (tupleCounts.get(tupleKey) ?? 0) + 1;
    tupleCounts.set(tupleKey, ordinal);
    return buildDedupeHash(txn, ordinal);
  });
}

export function applyExistingImportSkips<
  T extends { dedupeHash: string; skipReason?: "existing_import" | "user_removed" },
>(rows: T[], existingHashes: Set<string>): T[] {
  return rows.map((row) =>
    existingHashes.has(row.dedupeHash)
      ? { ...row, skipReason: "existing_import" as const }
      : row
  );
}
