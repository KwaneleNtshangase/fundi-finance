/** Shared types for statement import, categorisation, and reports. */

export type StatementFileType = "csv" | "ofx" | "pdf";

/** Parser output — signed ZAR: negative = money out, positive = money in. */
export type NormalizedTxn = {
  date: string; // YYYY-MM-DD (SAST calendar day from statement)
  description: string;
  amountZAR: number; // signed, 2dp
  rawMerchant: string;
  balanceAfter?: number;
  /** OFX FITID or CSV row id when present */
  externalId?: string;
  /** 0-based line in source file */
  lineIndex: number;
};

export type ReconciliationResult = {
  ok: boolean;
  parsedCount: number;
  parsedSignedSumCents: number;
  expectedCount?: number;
  expectedSignedSumCents?: number;
  expectedClosingBalanceCents?: number;
  computedClosingBalanceCents?: number;
  warnings: string[];
};

export type CategoriseSource = "rule" | "user" | "ai" | "uncategorised";

export type CategoriseResult = {
  category: string;
  type: "income" | "expense";
  confidence: number;
  source: CategoriseSource;
};

export type PreviewTxn = NormalizedTxn & {
  id: string; // client preview id
  categorisation: CategoriseResult;
  dedupeHash: string;
  /** Already in DB from a prior import */
  skipReason?: "existing_import" | "user_removed";
  /** Same hash earlier in this file — user should confirm both */
  possibleDuplicateInFile?: boolean;
  /** Money-in line that may be a card refund — defaults to income unless re-categorised */
  refundLike?: boolean;
};

export type ParseStatementResult = {
  fileType: StatementFileType;
  bankHint?: string;
  transactions: NormalizedTxn[];
  reconciliation: ReconciliationResult;
};

export type UserMerchantRule = {
  merchant_pattern: string;
  category: string;
  type: "income" | "expense";
};

/** Maps signed txn → budget_entries row shape (positive amount + type). */
export function txnToBudgetEntryFields(txn: Pick<NormalizedTxn, "amountZAR">) {
  const amountCents = Math.round(Math.abs(txn.amountZAR) * 100);
  const type: "income" | "expense" = txn.amountZAR < 0 ? "expense" : "income";
  return {
    type,
    amount: amountCents / 100,
    amountCents,
  };
}
