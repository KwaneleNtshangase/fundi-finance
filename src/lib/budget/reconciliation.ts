import type { NormalizedTxn, ReconciliationResult } from "./types";
import { amountToCents } from "./dedupe";

export type ReconciliationMeta = {
  expectedCount?: number;
  expectedSignedSum?: number;
  openingBalance?: number;
  closingBalance?: number;
};

export function reconcileTransactions(
  transactions: NormalizedTxn[],
  meta: ReconciliationMeta = {}
): ReconciliationResult {
  const parsedCount = transactions.length;
  const parsedSignedSumCents = transactions.reduce(
    (s, t) => s + amountToCents(t.amountZAR),
    0
  );

  const warnings: string[] = [];
  let ok = true;

  if (meta.expectedCount !== undefined && meta.expectedCount !== parsedCount) {
    ok = false;
    warnings.push(
      `Transaction count mismatch: parsed ${parsedCount}, statement reports ${meta.expectedCount}.`
    );
  }

  if (meta.expectedSignedSum !== undefined) {
    const expectedCents = amountToCents(meta.expectedSignedSum);
    if (expectedCents !== parsedSignedSumCents) {
      ok = false;
      warnings.push(
        `Signed sum mismatch: parsed ${parsedSignedSumCents / 100} ZAR, statement reports ${meta.expectedSignedSum} ZAR.`
      );
    }
  }

  let computedClosingBalanceCents: number | undefined;
  if (meta.openingBalance !== undefined) {
    computedClosingBalanceCents =
      amountToCents(meta.openingBalance) + parsedSignedSumCents;
    if (
      meta.closingBalance !== undefined &&
      amountToCents(meta.closingBalance) !== computedClosingBalanceCents
    ) {
      ok = false;
      warnings.push(
        `Closing balance mismatch: computed R${(computedClosingBalanceCents / 100).toFixed(2)}, statement R${meta.closingBalance.toFixed(2)}.`
      );
    }
  }

  return {
    ok,
    parsedCount,
    parsedSignedSumCents,
    expectedCount: meta.expectedCount,
    expectedSignedSumCents:
      meta.expectedSignedSum !== undefined ? amountToCents(meta.expectedSignedSum) : undefined,
    expectedClosingBalanceCents:
      meta.closingBalance !== undefined ? amountToCents(meta.closingBalance) : undefined,
    computedClosingBalanceCents,
    warnings,
  };
}

type ImportRow = { amountZAR: number; skipReason?: "existing_import" | "user_removed" };

/**
 * Re-run reconciliation after marking batch-overlap skips.
 * Surfaces cases where dedupe incorrectly dropped rows from the import set.
 */
export function reconcileAfterImportSkips(
  allTransactions: NormalizedTxn[],
  rows: ImportRow[],
  statement: ReconciliationResult
): ReconciliationResult {
  const warnings = [...statement.warnings];
  let ok = statement.ok;

  const fullCount = allTransactions.length;
  const fullSumCents = allTransactions.reduce((s, t) => s + amountToCents(t.amountZAR), 0);

  const toImport = rows.filter((r) => !r.skipReason);
  const skippedExisting = rows.filter((r) => r.skipReason === "existing_import");

  const importSumCents = toImport.reduce((s, r) => s + amountToCents(r.amountZAR), 0);
  const skippedSumCents = skippedExisting.reduce((s, r) => s + amountToCents(r.amountZAR), 0);

  if (importSumCents + skippedSumCents !== fullSumCents) {
    ok = false;
    warnings.push(
      "Import split mismatch: skipped and new rows do not add up to the parsed statement total — a transaction may have been dropped incorrectly."
    );
  }

  if (rows.length !== fullCount) {
    ok = false;
    warnings.push(
      `Row count mismatch after dedupe: ${rows.length} preview rows vs ${fullCount} parsed from file.`
    );
  }

  if (skippedExisting.length === 0) {
    if (toImport.length !== fullCount) {
      ok = false;
      warnings.push(
        `Post-dedupe count mismatch: ${toImport.length} to import vs ${fullCount} parsed.`
      );
    }
    if (importSumCents !== fullSumCents) {
      ok = false;
      warnings.push("Post-dedupe signed sum does not match the parsed statement total.");
    }
  } else if (fullSumCents !== statement.parsedSignedSumCents) {
    ok = false;
    warnings.push("Parsed statement total changed after dedupe — review before importing.");
  }

  return {
    ...statement,
    ok,
    warnings,
    parsedCount: toImport.length,
    parsedSignedSumCents: importSumCents,
  };
}
