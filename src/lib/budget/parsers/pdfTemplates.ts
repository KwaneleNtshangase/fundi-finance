import { findDateToken, parseStatementDate } from "./pdfDates";
import { parseAmountToken, type ParsedRow, type TextLine } from "./pdfLayout";

export type BankTemplate = {
  id: string;
  detect: RegExp;
  dateFormat: "dmy" | "ymd" | "dMon";
};

export const BANK_TEMPLATES: BankTemplate[] = [
  { id: "capitec", detect: /capitec/i, dateFormat: "dmy" },
  { id: "standard-bank", detect: /standard\s+bank|std\s+bank/i, dateFormat: "dmy" },
  { id: "fnb", detect: /\bfnb\b|first\s+national\s+bank/i, dateFormat: "dmy" },
];

function amountsOnLine(line: TextLine): { x: number; val: number }[] {
  return line.items
    .map((i) => ({ x: i.x, val: parseAmountToken(i.text) }))
    .filter((a): a is { x: number; val: number } => a.val !== null && Math.abs(a.val) >= 0.01)
    .sort((a, b) => a.x - b.x);
}

/** Template-aware row parser — uses x-positions for known bank column layouts. */
export function applyBankTemplate(
  bankId: string,
  lines: TextLine[],
  contextYear?: number
): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let previousDate: string | undefined;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const dateToken = findDateToken(line.text);
    if (!dateToken) continue;

    const iso = parseStatementDate(dateToken, contextYear, previousDate);
    if (!iso) continue;

    const positioned = amountsOnLine(line);
    if (positioned.length === 0) continue;

    let amountZAR: number;
    let balanceAfter: number | undefined;

    if (bankId === "capitec") {
      // Capitec: Money In (~350) | Money Out (~420) | Balance (rightmost)
      if (positioned.length >= 2) {
        balanceAfter = positioned[positioned.length - 1].val;
        const txn = positioned[positioned.length - 2];
        amountZAR = txn.x >= 400 ? -Math.abs(txn.val) : Math.abs(txn.val);
      } else {
        amountZAR = positioned[0].val;
      }
    } else if (bankId === "standard-bank") {
      // Standard Bank: Debit (~380) | Credit (~450) | Balance (rightmost)
      if (positioned.length >= 2) {
        balanceAfter = positioned[positioned.length - 1].val;
        const txn = positioned[positioned.length - 2];
        if (positioned.length >= 3) {
          const debit = positioned[positioned.length - 3];
          const credit = positioned[positioned.length - 2];
          if (Math.abs(debit.val) >= 0.01 && debit.x < 420) {
            amountZAR = -Math.abs(debit.val);
          } else if (Math.abs(credit.val) >= 0.01) {
            amountZAR = Math.abs(credit.val);
          } else {
            amountZAR = txn.x < 420 ? -Math.abs(txn.val) : Math.abs(txn.val);
          }
        } else {
          amountZAR = txn.x < 420 ? -Math.abs(txn.val) : Math.abs(txn.val);
        }
      } else {
        amountZAR = -Math.abs(positioned[0].val);
      }
    } else if (bankId === "fnb") {
      // FNB: signed Amount | Balance (rightmost)
      if (positioned.length >= 2) {
        amountZAR = positioned[positioned.length - 2].val;
        balanceAfter = positioned[positioned.length - 1].val;
      } else {
        amountZAR = positioned[0].val;
      }
    } else {
      amountZAR = positioned[positioned.length - 1].val;
    }

    if (amountZAR === 0) continue;

    const desc = line.text
      .replace(dateToken, "")
      .replace(/R?\s*-?\d{1,3}(?:[\s]\d{3})*\.\d{2}/g, " ")
      .replace(/R?\s*-?\d+\.\d{2}/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    rows.push({
      date: iso,
      description: desc || "Transaction",
      amountZAR,
      balanceAfter,
      lineIndex: i,
      needsReview: !desc,
    });
    previousDate = iso;
  }

  return rows;
}

export function mergeTemplateRows(
  genericRows: ParsedRow[],
  templateRows: ParsedRow[],
  bankId: string
): ParsedRow[] {
  if (templateRows.length >= genericRows.length * 0.7) {
    return templateRows.map((r) => ({ ...r, needsReview: r.needsReview ?? false }));
  }
  return genericRows.map((r) => ({
    ...r,
    description: r.description || `[${bankId}] Transaction`,
  }));
}
