import { findDateToken, parseStatementDate } from "./pdfDates";
import {
  amountFromBucket,
  bucketItemsToColumns,
  dateTokenInColumn,
  fnbAmountFromBucket,
  fnbBalanceFromBucket,
  parseAmountToken,
  parseFnbAmountToken,
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
  { id: "fnb", detect: /\bfnb\b|first\s+national\s+bank|fnb\.co\.za|gold\s+business\s+account/i, dateFormat: "dMon" },
];

const CAPITEC_HEADER_RE =
  /date.*description.*category.*money\s+in.*money\s+out.*fee.*balance/i;

const FNB_HEADER_RE = /\bdate\b.*\bdescription\b.*\bamount\b.*\bbalance\b/i;
const FNB_TRANSACTIONS_SECTION = /transactions\s+in\s+rand\s*\(zar\)/i;
const FNB_SECTION_END = /closing\s+balance|turnover\s+for\s+statement\s+period/i;
const FNB_FOOTER =
  /please\s+contact\s+us|first\s+national\s+bank|page\s+\d+\s+of\s+\d+/i;

/** Bank-agnostic transaction-table header (Date + Balance + amount columns). */
export function detectTransactionTableHeader(
  line: TextLine,
  bankId?: string
): ColumnLayout | null {
  if (bankId === "capitec" || !bankId) {
    const capitec = detectCapitecColumns(line);
    if (capitec) return capitec;
  }
  if (bankId === "fnb" || !bankId) {
    const fnb = detectFnbColumns(line);
    if (fnb) return fnb;
  }
  return null;
}

const FOOTER_LINE = /unique\s+document\s+no\.|page\s+\d+\s+of\s+\d+/i;
const TRANSACTION_HISTORY_TITLE = /transaction\s+history/i;
const SCHEDULED_PAYMENTS_SECTION = /scheduled\s+payments/i;
const SUMMARY_SECTION = /\bsummary\b/i;

function isCapitecExcludedLine(line: TextLine): boolean {
  if (FOOTER_LINE.test(line.text)) return true;
  if (SCHEDULED_PAYMENTS_SECTION.test(line.text)) return true;
  if (SUMMARY_SECTION.test(line.text) && !CAPITEC_HEADER_RE.test(line.text)) return true;
  return false;
}

function isScheduledPaymentsLine(line: TextLine): boolean {
  return SCHEDULED_PAYMENTS_SECTION.test(line.text);
}

function isSummaryLine(line: TextLine): boolean {
  return SUMMARY_SECTION.test(line.text) && !CAPITEC_HEADER_RE.test(line.text);
}

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

/** Detect FNB column x-positions from Date Description Amount Balance header. */
export function detectFnbColumns(line: TextLine): ColumnLayout | null {
  const normalized = line.text.replace(/\s+/g, " ");
  if (!FNB_HEADER_RE.test(normalized)) return null;
  if (/money\s+in|money\s+out|category/i.test(normalized)) return null;

  const findCol = (label: RegExp, fallbackX: number, tolerance = 35): ColumnRange => {
    const item = line.items.find((i) => label.test(i.text.replace(/\*/g, "")));
    return item ? colRange(item.x, tolerance) : colRange(fallbackX, tolerance);
  };

  return {
    date: findCol(/^date$/i, 25, 25),
    description: findCol(/^description$/i, 200, 150),
    amount: findCol(/^amount$/i, 462, 35),
    balance: findCol(/^balance$/i, 525, 35),
    accruedCharges: colRange(565, 30),
  };
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
  let seenTransactionHistory = false;
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

    if (TRANSACTION_HISTORY_TITLE.test(line.text)) {
      seenTransactionHistory = true;
      inTransactionTable = false;
      continue;
    }

    if (isScheduledPaymentsLine(line) || isSummaryLine(line)) {
      inTransactionTable = false;
      continue;
    }

    const headerCols = detectCapitecColumns(line);
    if (headerCols) {
      if (seenTransactionHistory) {
        columns = headerCols;
        inTransactionTable = true;
      }
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

export type FnbParseResult = {
  rows: ParsedRow[];
  columns: ColumnLayout | null;
  balanceChainOk: boolean;
};

function isFnbExcludedLine(line: TextLine): boolean {
  if (FNB_FOOTER.test(line.text)) return true;
  if (FNB_SECTION_END.test(line.text)) return true;
  if (/^opening\s+balance/i.test(line.text)) return true;
  return false;
}

function fnbDescriptionFromLine(
  line: TextLine,
  columns: ColumnLayout,
  dateToken: string
): string {
  const dateX = columns.date?.x ?? 25;
  const amountX = columns.amount?.x ?? 462;
  const descItems = line.items.filter(
    (item) =>
      item.text !== dateToken &&
      item.x > dateX + 10 &&
      item.x < amountX - 15 &&
      parseFnbAmountToken(item.text) === null
  );
  return descItems
    .map((i) => i.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

/** FNB-specific parser — single Amount column with Cr/Dr suffix. */
export function parseFnbLayout(
  lines: TextLine[],
  contextYear?: number
): FnbParseResult {
  let columns: ColumnLayout | null = null;
  const rows: ParsedRow[] = [];
  let previousDate: string | undefined;
  let seenTransactionsSection = false;
  let inTransactionTable = false;
  let prevBalance: number | undefined;
  let balanceChainOk = true;
  let lastMainRowIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (FNB_TRANSACTIONS_SECTION.test(line.text)) {
      seenTransactionsSection = true;
      inTransactionTable = false;
      continue;
    }

    const headerCols = detectFnbColumns(line);
    if (headerCols) {
      if (seenTransactionsSection) {
        columns = headerCols;
        inTransactionTable = true;
      }
      continue;
    }

    if (isFnbExcludedLine(line)) {
      inTransactionTable = false;
      continue;
    }

    if (!inTransactionTable || !columns) continue;

    const dateToken = dateTokenInColumn(line, columns.date);
    const buckets = bucketItemsToColumns(line, columns);
    const balanceAfter = fnbBalanceFromBucket(buckets, "balance");

    if (!dateToken) {
      if (lastMainRowIndex >= 0 && balanceAfter === null) {
        const extra = fnbDescriptionFromLine(line, columns, "");
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

    const amountZAR = fnbAmountFromBucket(buckets, "amount");
    if (amountZAR === null || Math.abs(amountZAR) < 0.01) continue;

    const desc = fnbDescriptionFromLine(line, columns, dateToken) || "Transaction";

    if (prevBalance !== undefined) {
      const expected = amountToCents(prevBalance) + amountToCents(amountZAR);
      if (Math.abs(expected - amountToCents(balanceAfter)) > 1) {
        balanceChainOk = false;
      }
    }

    rows.push({
      date: iso,
      description: desc,
      amountZAR,
      balanceAfter,
      lineIndex: i,
      needsReview: !desc || desc === "Transaction",
    });
    lastMainRowIndex = rows.length - 1;
    prevBalance = balanceAfter;
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
  if (bankId === "fnb") {
    return parseFnbLayout(lines, contextYear).rows;
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
  if ((bankId === "capitec" || bankId === "fnb") && templateRows.length > 0) {
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
