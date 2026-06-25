import { findDateToken, parseStatementDate } from "./pdfDates";
import {
  amountFromBucket,
  bucketItemsToColumns,
  dateTokenInColumn,
  parseAmountToken,
  textFromBucket,
  type ColumnLayout,
  type ColumnRange,
  type ParsedRow,
  type TextLine,
} from "./pdfLayout";

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

const CAPITEC_HEADER_RE =
  /date.*description.*category.*money\s+in.*money\s+out.*fee.*balance/i;

const FOOTER_LINE = /unique\s+document\s+no\.|page\s+\d+\s+of\s+\d+/i;
const SKIP_SECTION =
  /^(scheduled\s+payments|spending\s+summary|money\s+in\/out\s+summary|card\s+subscriptions|self-scheduled\s+payment)/i;
const SUMMARY_LINE = /summary|digital\s+payments\s+-/i;

function colRange(x: number, tolerance = 55): ColumnRange {
  return { x, tolerance };
}

/** Detect Capitec column x-positions from the repeated table header row. */
export function detectCapitecColumns(line: TextLine): ColumnLayout | null {
  if (!CAPITEC_HEADER_RE.test(line.text.replace(/\*/g, ""))) return null;

  const findCol = (label: RegExp): ColumnRange | undefined => {
    const item = line.items.find((i) => label.test(i.text.replace(/\*/g, "")));
    return item ? colRange(item.x) : undefined;
  };

  const layout: ColumnLayout = {
    date: findCol(/^date$/i),
    description: findCol(/^description$/i),
    category: findCol(/^category$/i),
    moneyIn: findCol(/^money\s+in$/i),
    moneyOut: findCol(/^money\s+out$/i),
    fee: findCol(/^fee/i),
    balance: findCol(/^balance$/i),
  };

  if (!layout.date || !layout.balance) return null;
  return layout;
}

function isCapitecExcludedLine(line: TextLine): boolean {
  if (FOOTER_LINE.test(line.text)) return true;
  if (SKIP_SECTION.test(line.text)) return true;
  if (SUMMARY_LINE.test(line.text) && !CAPITEC_HEADER_RE.test(line.text)) return true;
  return false;
}

function descriptionFromBuckets(
  buckets: ReturnType<typeof bucketItemsToColumns>,
  dateToken: string
): string {
  const desc = textFromBucket(buckets, "description");
  if (desc) return desc.replace(dateToken, "").trim();
  const category = textFromBucket(buckets, "category");
  const parts = [desc, category].filter(Boolean);
  return parts.join(" ").trim();
}

function continuationFromBuckets(buckets: ReturnType<typeof bucketItemsToColumns>): string {
  const desc = textFromBucket(buckets, "description");
  const cat = textFromBucket(buckets, "category");
  return [desc, cat].filter(Boolean).join(" ").trim();
}

export type CapitecParseResult = {
  rows: ParsedRow[];
  columns: ColumnLayout | null;
  balanceChainOk: boolean;
};

/** Capitec-specific parser using positional columns from the real statement layout. */
export function parseCapitecLayout(
  lines: TextLine[],
  contextYear?: number
): CapitecParseResult {
  let columns: ColumnLayout | null = null;
  const rows: ParsedRow[] = [];
  let previousDate: string | undefined;
  let inTransactionTable = false;
  let prevBalance: number | undefined;
  let balanceChainOk = true;
  const hasLaterPages = lines.some((l) => l.page > 1);
  let lastMainRowIndex = -1;

  const pushRow = (
    row: Omit<ParsedRow, "lineIndex"> & { lineIndex: number },
    feeAmount?: number
  ) => {
    const finalBalance = row.balanceAfter!;
    const mainBalance =
      feeAmount !== undefined ? finalBalance - feeAmount : finalBalance;

    if (prevBalance !== undefined) {
      const expectedMain = amountToCents(prevBalance) + amountToCents(row.amountZAR);
      if (Math.abs(expectedMain - amountToCents(mainBalance)) > 1) {
        row.balanceStepFailed = true;
        row.needsReview = true;
        balanceChainOk = false;
      }
    }

    rows.push({ ...row, balanceAfter: mainBalance });
    lastMainRowIndex = rows.length - 1;

    if (feeAmount !== undefined && Math.abs(feeAmount) >= 0.01) {
      if (Math.abs(amountToCents(mainBalance) + amountToCents(feeAmount) - amountToCents(finalBalance)) > 1) {
        balanceChainOk = false;
      }
      rows.push({
        date: row.date,
        description: "Bank Charges",
        amountZAR: feeAmount,
        balanceAfter: finalBalance,
        lineIndex: row.lineIndex,
        needsReview: false,
      });
      prevBalance = finalBalance;
    } else {
      prevBalance = mainBalance;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.page === 1 && hasLaterPages) continue;

    const headerCols = detectCapitecColumns(line);
    if (headerCols) {
      columns = headerCols;
      inTransactionTable = true;
      continue;
    }

    if (isCapitecExcludedLine(line)) continue;

    if (!inTransactionTable || !columns) continue;

    const dateToken = dateTokenInColumn(line, columns.date);
    const buckets = bucketItemsToColumns(line, columns);
    const balanceAfter = amountFromBucket(buckets, "balance");

    if (!dateToken) {
      if (lastMainRowIndex >= 0 && balanceAfter === null) {
        const extra = continuationFromBuckets(buckets);
        if (extra) {
          const last = rows[lastMainRowIndex];
          last.description = `${last.description} ${extra}`.replace(/\s+/g, " ").trim();
        }
      }
      continue;
    }

    if (balanceAfter === null) continue;

    const iso = parseStatementDate(dateToken, contextYear, previousDate);
    if (!iso) continue;

    const moneyIn = amountFromBucket(buckets, "moneyIn");
    const moneyOut = amountFromBucket(buckets, "moneyOut");
    const fee = amountFromBucket(buckets, "fee");

    let amountZAR: number | null = null;
    let uncertainAmount = false;

    if (moneyIn !== null && Math.abs(moneyIn) >= 0.01) {
      amountZAR = Math.abs(moneyIn);
    } else if (moneyOut !== null && Math.abs(moneyOut) !== 0) {
      amountZAR = moneyOut <= 0 ? moneyOut : -Math.abs(moneyOut);
    } else {
      uncertainAmount = true;
      continue;
    }

    const desc = descriptionFromBuckets(buckets, dateToken) || "Transaction";
    const feeAmount =
      fee !== null && Math.abs(fee) >= 0.01 ? (fee <= 0 ? fee : -Math.abs(fee)) : undefined;

    pushRow(
      {
        date: iso,
        description: desc,
        amountZAR,
        balanceAfter,
        uncertainAmount,
        needsReview: uncertainAmount || !desc,
        lineIndex: i,
      },
      feeAmount
    );
    previousDate = iso;
  }

  return { rows, columns, balanceChainOk };
}

function amountToCents(n: number): number {
  return Math.round(n * 100);
}

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
  if (bankId === "capitec") {
    return parseCapitecLayout(lines, contextYear).rows;
  }

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

    if (bankId === "standard-bank") {
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
  if (bankId === "capitec" && templateRows.length > 0) {
    return templateRows.map((r) => ({ ...r, needsReview: r.needsReview ?? false }));
  }
  if (templateRows.length >= genericRows.length * 0.7) {
    return templateRows.map((r) => ({ ...r, needsReview: r.needsReview ?? false }));
  }
  return genericRows.map((r) => ({
    ...r,
    description: r.description || `[${bankId}] Transaction`,
  }));
}

export function capitecBalanceChainReconciles(
  rows: ParsedRow[],
  openingBalance?: number,
  closingBalance?: number
): boolean {
  if (closingBalance === undefined) return true;

  const lastWithBalance = [...rows].reverse().find((r) => r.balanceAfter !== undefined);
  if (!lastWithBalance?.balanceAfter) return false;
  if (Math.abs(amountToCents(lastWithBalance.balanceAfter) - amountToCents(closingBalance)) > 1) {
    return false;
  }

  if (openingBalance !== undefined) {
    const sumCents = rows.reduce((s, r) => s + amountToCents(r.amountZAR), 0);
    const expected = amountToCents(openingBalance) + sumCents;
    if (Math.abs(expected - amountToCents(closingBalance)) > 1) return false;
  }

  return !rows.some((r) => r.balanceStepFailed);
}
