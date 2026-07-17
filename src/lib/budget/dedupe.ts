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

  if (txn.accountLabel) {
    parts.push(`acct:${normaliseDescription(txn.accountLabel)}`);
  }

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

/** An existing DB entry reduced to what duplicate-matching needs. */
export type ExistingTxnKey = {
  entry_date: string;
  amountCents: number;
  type: "income" | "expense";
  description: string | null;
};

/** date | amountCents | type - the coarse identity two statements would share. */
function possibleDupeKey(date: string, amountCents: number, type: "income" | "expense"): string {
  return `${date}|${amountCents}|${type}`;
}

/**
 * Flag preview rows that match an existing DB entry on date + amount + type
 * even when the exact dedupe hash differs (overlapping statements, a row added
 * manually before, or a balance/label difference). These are default-skipped
 * as "existing_import" so a re-import can't silently duplicate them, and carry
 * `possibleDuplicate` so the UI can let the user verify and keep genuine ones.
 *
 * Exact-hash matches (already `skipReason`) and rows the user explicitly removed
 * are left untouched. Within a single import, N identical rows only absorb the
 * first N existing matches, so genuinely new repeats past that still import.
 */
export function flagPossibleDuplicates<
  T extends {
    date: string;
    amountZAR: number;
    description: string;
    isTransfer?: boolean;
  },
>(
  rows: T[],
  existing: ExistingTxnKey[]
): (T & {
  skipReason?: "existing_import" | "user_removed";
  possibleDuplicate?: boolean;
  duplicateOfDescription?: string;
})[] {
  const remaining = new Map<string, string[]>();
  for (const e of existing) {
    const key = possibleDupeKey(e.entry_date, e.amountCents, e.type);
    const list = remaining.get(key) ?? [];
    list.push(e.description ?? "");
    remaining.set(key, list);
  }

  return rows.map((row) => {
    const alreadySkipped = (row as { skipReason?: string }).skipReason;
    if (alreadySkipped || row.isTransfer) return row;
    const cents = amountToCents(Math.abs(row.amountZAR));
    const type: "income" | "expense" = row.amountZAR < 0 ? "expense" : "income";
    const key = possibleDupeKey(row.date, cents, type);
    const list = remaining.get(key);
    if (list && list.length > 0) {
      const matchedDesc = list.shift() ?? "";
      return {
        ...row,
        skipReason: "existing_import" as const,
        possibleDuplicate: true,
        duplicateOfDescription: matchedDesc || undefined,
      };
    }
    return row;
  });
}
