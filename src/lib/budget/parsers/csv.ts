import Papa from "papaparse";
import type { NormalizedTxn, ParseStatementResult } from "../types";
import { reconcileTransactions } from "../reconciliation";
import { detectBankProfile, mapCsvRowToTxn } from "./csvProfiles";

export function parseCsvStatement(text: string): ParseStatementResult {
  const parsed = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  if (parsed.errors.length > 0 && parsed.data.length === 0) {
    throw new Error(`CSV parse error: ${parsed.errors[0]?.message ?? "unknown"}`);
  }

  const headers = parsed.meta.fields ?? Object.keys(parsed.data[0] ?? {});
  const profile = detectBankProfile(headers);

  const transactions: NormalizedTxn[] = [];
  parsed.data.forEach((row, i) => {
    if (!profile) return;
    const txn = mapCsvRowToTxn(row, profile.map, i);
    if (txn) transactions.push(txn);
  });

  if (!profile) {
    return {
      fileType: "csv",
      transactions: [],
      reconciliation: reconcileTransactions([], {
        expectedCount: 0,
      }),
    };
  }

  const reconciliation = reconcileTransactions(transactions);

  return {
    fileType: "csv",
    bankHint: profile.id,
    transactions,
    reconciliation,
  };
}
