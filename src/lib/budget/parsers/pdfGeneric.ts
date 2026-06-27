import { findDateToken, parseStatementDate, extractContextYear } from "./pdfDates";
import {
  amountInColumn,
  dateTokenInColumn,
  findAmountTokens,
  groupItemsIntoLines,
  inferAmountColumns,
  itemNearColumn,
  nearestItem,
  parseAmountToken,
  parseFnbAmountToken,
  textInColumn,
  type ColumnLayout,
  type ColumnRange,
  type ParsedRow,
  type PositionedItem,
  type TextLine,
} from "./pdfLayout";
import { applyBankTemplate, BANK_TEMPLATES, cleanDescription, mergeTemplateRows } from "./pdfTemplates";

export type BalanceMeta = {
  openingBalance?: number;
  closingBalance?: number;
  expectedCount?: number;
};

const SKIP_LINE =
  /^(page\s+\d|statement|account\s+number|opening\s+balance|closing\s+balance|brought\s+forward|carried\s+forward|total\s+debits|total\s+credits|balance\s+brought)/i;

const FOOTER_LINE = /unique\s+document\s+no\.|page\s+\d+\s+of\s+\d+/i;
const SUMMARY_BLOCK = /summary|scheduled\s+payments/i;

function colRange(x: number, tolerance = 55): ColumnRange {
  return { x, tolerance };
}

/** Find a transaction-table header row and derive column x-positions. */
export function detectGenericHeaderColumns(line: TextLine): ColumnLayout | null {
  const lower = line.text.toLowerCase();
  if (!/\bdate\b/.test(lower) || !/\bbalance\b/.test(lower)) return null;

  const findCol = (label: RegExp): ColumnRange | undefined => {
    const item = line.items.find((i) => label.test(i.text.replace(/\*/g, "")));
    return item ? colRange(item.x) : undefined;
  };

  const layout: ColumnLayout = {
    date: findCol(/^date$/i) ?? line.items.find((i) => /\bdate\b/i.test(i.text))
      ? colRange(line.items.find((i) => /\bdate\b/i.test(i.text))!.x)
      : undefined,
    description: findCol(/^description$/i),
    moneyIn: findCol(/^money\s+in$/i) ?? findCol(/^credit$/i),
    moneyOut: findCol(/^money\s+out$/i) ?? findCol(/^debit$/i),
    debit: findCol(/^debit$/i),
    credit: findCol(/^credit$/i),
    balance: findCol(/^balance$/i) ?? line.items.find((i) => /\bbalance\b/i.test(i.text))
      ? colRange(line.items.find((i) => /\bbalance\b/i.test(i.text))!.x)
      : undefined,
  };

  if (!layout.date || !layout.balance) return null;
  return layout;
}

function isExcludedLine(line: TextLine, inTable: boolean): boolean {
  if (FOOTER_LINE.test(line.text)) return true;
  if (SKIP_LINE.test(line.text)) return true;
  if (!inTable && SUMMARY_BLOCK.test(line.text)) return true;
  if (/^date\s+description/i.test(line.text)) return true;
  return false;
}

function descriptionFromGenericColumns(
  line: TextLine,
  cols: ColumnLayout,
  dateToken: string
): string {
  const amountCols = [cols.moneyIn, cols.moneyOut, cols.debit, cols.credit, cols.fee, cols.balance];
  const descItems = line.items.filter((item) => {
    if (item.text === dateToken) return false;
    if (cols.date && itemNearColumn(item, cols.date)) return false;
    for (const col of amountCols) {
      if (col && itemNearColumn(item, col) && parseAmountToken(item.text) !== null) return false;
    }
    return true;
  });
  return descItems
    .map((i) => i.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function continuationGenericText(line: TextLine, cols: ColumnLayout): string {
  return line.items
    .filter((item) => {
      if (cols.date && itemNearColumn(item, cols.date)) return false;
      for (const col of [cols.moneyIn, cols.moneyOut, cols.debit, cols.credit, cols.balance]) {
        if (col && itemNearColumn(item, col)) return false;
      }
      return true;
    })
    .map((i) => i.text)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

function deriveAmountFromColumns(
  line: TextLine,
  cols: ColumnLayout,
  fallbackColumns: ReturnType<typeof inferAmountColumns>
): { amount: number | null; uncertain: boolean } {
  const moneyIn = amountInColumn(line, cols.moneyIn) ?? amountInColumn(line, cols.credit);
  const moneyOut = amountInColumn(line, cols.moneyOut) ?? amountInColumn(line, cols.debit);

  if (moneyIn !== null && Math.abs(moneyIn) >= 0.01) {
    return { amount: Math.abs(moneyIn), uncertain: false };
  }
  if (moneyOut !== null && Math.abs(moneyOut) >= 0.01) {
    const val = moneyOut <= 0 ? moneyOut : -Math.abs(moneyOut);
    return { amount: val, uncertain: false };
  }

  if (fallbackColumns.debitX !== undefined && fallbackColumns.creditX !== undefined) {
    const debitItem = nearestItem(line.items, fallbackColumns.debitX, 55);
    const creditItem = nearestItem(line.items, fallbackColumns.creditX, 55);
    const debit = debitItem ? parseAmountToken(debitItem.text) : null;
    const credit = creditItem ? parseAmountToken(creditItem.text) : null;
    if (debit !== null && Math.abs(debit) >= 0.01 && (credit === null || Math.abs(credit) < 0.01)) {
      return { amount: -Math.abs(debit), uncertain: false };
    }
    if (credit !== null && Math.abs(credit) >= 0.01) {
      return { amount: Math.abs(credit), uncertain: false };
    }
  }

  const amounts = findAmountTokens(line.text);
  if (amounts.length >= 2 && cols.balance) {
    const balItem = nearestItem(line.items, cols.balance.x);
    if (balItem) {
      const balVal = parseAmountToken(balItem.text);
      const txn = amounts.find((a) => a.value !== balVal);
      if (txn) return { amount: txn.value, uncertain: true };
    }
  }

  return { amount: null, uncertain: true };
}

export function extractBalances(fullText: string, lines: TextLine[]): BalanceMeta {
  const meta: BalanceMeta = {};

  const parseBal = (raw: string) => parseFnbAmountToken(raw) ?? parseAmountToken(raw);

  const openMatch = fullText.match(
    /(?:opening\s+balance|balance\s+brought\s+forward|b\/f)[:\s]*([\d\s.,]+(?:Cr|Dr)?)/i
  );
  if (openMatch) meta.openingBalance = parseBal(openMatch[1].trim()) ?? undefined;

  const closeMatch = fullText.match(
    /(?:closing\s+balance|balance\s+carried\s+forward|c\/f)[:\s]*([\d\s.,]+(?:Cr|Dr)?)/i
  );
  if (closeMatch) meta.closingBalance = parseBal(closeMatch[1].trim()) ?? undefined;

  if (!meta.openingBalance) {
    for (const line of lines.slice(0, 20)) {
      if (/opening|b\/f|brought forward/i.test(line.text)) {
        for (const item of line.items) {
          const val = parseFnbAmountToken(item.text);
          if (val !== null) {
            meta.openingBalance = val;
            break;
          }
        }
      }
    }
  }

  return meta;
}

export function detectBankFromText(fullText: string): string | null {
  // Detect the ISSUER from branding only. Transaction descriptions routinely
  // name OTHER banks (e.g. "Magtape Credit Capitec", "KWANELE CAPITEC",
  // "ABSA BANK FLAT 9") - matching a bare bank word mis-routes the parser, so
  // we require issuer-specific markers (e.g. "Capitec Bank" / a bank domain).
  const t = fullText.toLowerCase();
  if (/capitec\s*bank|capitecbank\.co\.za/.test(t)) return "capitec";
  if (/standard\s+bank|standardbank\.co\.za/.test(t)) return "standard-bank";
  if (/first\s+national\s+bank|fnb\.co\.za|gold\s+business\s+account/.test(t)) return "fnb";
  if (/nedbank\.co\.za|nedbank\s+(?:ltd|limited)/.test(t)) return "nedbank";
  if (/absa\.co\.za|absa\s+bank\s+(?:ltd|limited)/.test(t)) return "absa";
  return null;
}

export function accountLabelFromBank(bank: string | null, fileName?: string): string {
  if (bank === "capitec") return "Capitec";
  if (bank === "standard-bank") return "Standard Bank";
  if (bank === "fnb") return "FNB";
  if (bank === "nedbank") return "Nedbank";
  if (bank === "absa") return "Absa";
  if (fileName) return fileName.replace(/\.[^.]+$/, "");
  return "Bank account";
}

function parseRowFromLine(
  line: TextLine,
  columns: ReturnType<typeof inferAmountColumns>,
  headerCols: ColumnLayout | null,
  lineIndex: number,
  previousDate?: string,
  contextYear?: number
): ParsedRow | null {
  if (isExcludedLine(line, !!headerCols)) return null;

  const dateToken = headerCols
    ? dateTokenInColumn(line, headerCols.date)
    : findDateToken(line.text);
  if (!dateToken) return null;

  const iso = parseStatementDate(dateToken, contextYear, previousDate);
  if (!iso) return null;

  const balanceAfter = headerCols
    ? amountInColumn(line, headerCols.balance)
    : (() => {
        if (columns.balanceX !== undefined) {
          const balItem = nearestItem(line.items, columns.balanceX);
          return balItem ? parseAmountToken(balItem.text) : null;
        }
        const amounts = findAmountTokens(line.text);
        return amounts.length >= 2 ? amounts[amounts.length - 1].value : null;
      })();

  if (headerCols && balanceAfter === null) return null;

  const { amount, uncertain } = headerCols
    ? deriveAmountFromColumns(line, headerCols, columns)
    : (() => {
        const result = parseRowLegacy(line, columns, dateToken);
        return result;
      })();

  if (amount === null || amount === 0) return null;

  const desc = headerCols
    ? descriptionFromGenericColumns(line, headerCols, dateToken)
    : line.text
        .replace(dateToken, "")
        .replace(/R?\s*-?\d[\d\s.,]*/g, " ")
        .replace(/\s+/g, " ")
        .trim();

  const cleaned = cleanDescription(desc);
  return {
    date: iso,
    description: cleaned || "Transaction",
    amountZAR: amount,
    balanceAfter: balanceAfter ?? undefined,
    needsReview: uncertain || !cleaned || cleaned.length < 2,
    uncertainAmount: uncertain,
    lineIndex,
  };
}

function parseRowLegacy(
  line: TextLine,
  columns: ReturnType<typeof inferAmountColumns>,
  dateToken: string
): { amount: number | null; uncertain: boolean } {
  if (columns.debitX !== undefined && columns.creditX !== undefined) {
    const debitItem = nearestItem(line.items, columns.debitX, 55);
    const creditItem = nearestItem(line.items, columns.creditX, 55);
    const debit = debitItem ? parseAmountToken(debitItem.text) : null;
    const credit = creditItem ? parseAmountToken(creditItem.text) : null;
    if (debit !== null && Math.abs(debit) >= 0.01 && (credit === null || Math.abs(credit) < 0.01)) {
      return { amount: -Math.abs(debit), uncertain: false };
    }
    if (credit !== null && Math.abs(credit) >= 0.01) {
      return { amount: Math.abs(credit), uncertain: false };
    }
  }

  const amounts = findAmountTokens(line.text);
  if (amounts.length === 0) return { amount: null, uncertain: true };
  if (columns.balanceX !== undefined && amounts.length >= 2) {
    return { amount: amounts[amounts.length - 2].value, uncertain: false };
  }
  return { amount: amounts[amounts.length - 1].value, uncertain: true };
}

/** Generic PDF transaction extractor from positioned text. */
export function parseGenericPdfLayout(
  items: PositionedItem[],
  fullText: string
): { rows: ParsedRow[]; bankHint: string | null; balances: BalanceMeta } {
  const lines = groupItemsIntoLines(items);
  const bankHint = detectBankFromText(fullText);
  const balances = extractBalances(fullText, lines);
  const columns = inferAmountColumns(lines);

  const contextYearMatch = fullText.match(/\b(20\d{2})\b/);
  const contextYear = contextYearMatch ? +contextYearMatch[1] : undefined;

  let headerCols: ColumnLayout | null = null;
  for (const line of lines) {
    const detected = detectGenericHeaderColumns(line);
    if (detected) {
      headerCols = detected;
      break;
    }
  }

  const rows: ParsedRow[] = [];
  let previousDate: string | undefined;
  let inTable = !!headerCols;

  lines.forEach((line, idx) => {
    const detected = detectGenericHeaderColumns(line);
    if (detected) {
      headerCols = detected;
      inTable = true;
      return;
    }

    if (isExcludedLine(line, inTable)) return;

    const dateToken = headerCols
      ? dateTokenInColumn(line, headerCols.date)
      : findDateToken(line.text);

    if (!dateToken && headerCols && rows.length > 0) {
      const balanceAfter = amountInColumn(line, headerCols.balance);
      if (!balanceAfter) {
        const extra = continuationGenericText(line, headerCols);
        if (extra) {
          const last = rows[rows.length - 1];
          last.description = `${last.description} ${extra}`.replace(/\s+/g, " ").trim();
        }
      }
      return;
    }

    const row = parseRowFromLine(line, columns, headerCols, idx, previousDate, contextYear);
    if (row) {
      rows.push(row);
      previousDate = row.date;
    }
  });

  return { rows, bankHint, balances };
}

/** Build lines from a test fixture layout JSON. */
export function linesFromFixture(
  fixture: { lines: { y: number; page?: number; items: { x: number; text: string }[] }[] }
): TextLine[] {
  const items: PositionedItem[] = [];
  for (const line of fixture.lines) {
    for (const item of line.items) {
      items.push({ text: item.text, x: item.x, y: line.y, page: line.page ?? 1 });
    }
  }
  return groupItemsIntoLines(items);
}

export function parseLayoutFixture(
  fixture: {
    headerText?: string;
    openingBalance?: number;
    closingBalance?: number;
    expectedCount?: number;
    lines: { y: number; page?: number; items: { x: number; text: string }[] }[];
  }
): { rows: ParsedRow[]; bankHint: string | null; balances: BalanceMeta } {
  const items: PositionedItem[] = [];
  for (const line of fixture.lines) {
    for (const item of line.items) {
      items.push({ text: item.text, x: item.x, y: line.y, page: line.page ?? 1 });
    }
  }
  const fullText = [
    fixture.headerText ?? "",
    ...fixture.lines.map((l) => l.items.map((i) => i.text).join(" ")),
  ].join(" ");
  const generic = parseGenericPdfLayout(items, fullText);
  const lines = groupItemsIntoLines(items);
  const bankId = generic.bankHint;
  let rows = generic.rows;
  if (bankId && BANK_TEMPLATES.some((t) => t.id === bankId)) {
    const contextYear = extractContextYear(fullText, bankId);
    const templateRows = applyBankTemplate(bankId, lines, contextYear);
    rows = mergeTemplateRows(generic.rows, templateRows, bankId);
  }
  if (fixture.openingBalance !== undefined || fixture.closingBalance !== undefined) {
    generic.balances.openingBalance = fixture.openingBalance ?? generic.balances.openingBalance;
    generic.balances.closingBalance = fixture.closingBalance ?? generic.balances.closingBalance;
  }
  return { rows, bankHint: generic.bankHint, balances: generic.balances };
}
