import type { NormalizedTxn } from "./types";

const REFUND_PATTERN = /refund|reversal|chargeback|returned|credit adj|reversed/i;

/** Positive statement lines that look like card refunds — import as income unless re-categorised. */
export function isRefundLikeCredit(txn: Pick<NormalizedTxn, "amountZAR" | "description">): boolean {
  if (txn.amountZAR <= 0) return false;
  return REFUND_PATTERN.test(txn.description);
}
