import { findDateToken, parseStatementDate } from "./pdfDates";
import {
  findAmountTokens,
  groupItemsIntoLines,
  inferAmountColumns,
  nearestItem,
  parseAmountToken,
  type ParsedRow,
  type PositionedItem,
  type TextLine,
} from "./pdfLayout";
import { applyBankTemplate, BANK_TEMPLATES, mergeTemplateRows } from "./pdfTemplates";

export type BalanceMeta = {
  openingBalance?: number;
  closingBalance?: number;
  expectedCount?: number;
};

const SKIP_LINE =
  /^(page\s+\d|statement|account\s+number|opening\s+balance|closing\s+balance|brought\s+forward|carried\s+forward|total\s+debits|total\s+credits|balance\s+brought)/i;

export function extractBalances(fullText: string, lines: TextLine[]): BalanceMeta {
  const meta: BalanceMeta = {};

  const openMatch = fullText.match(
    /(?:opening\s+balance|balance\s+brought\s+forward|b\/f)[:\s]*R?\s*([\d\s.,()-]+)/i
  );
  if (openMatch) meta.openingBalance = parseAmountToken(openMatch[1]) ?? undefined;

  const closeMatch = fullText.match(
    /(?:closing\s+balance|balance\s+carried\s+forward|c\/f)[:\s]*R?\s*([\d\s.,()-]+)/i
  );
  if (closeMatch) meta.closingBalance = parseAmountToken(closeMatch[1]) ?? undefined;

  const countMatch = fullText.match(/(\d+)\s+transactions?/i);
  if (countMatch) meta.expectedCount = +countMatch[1];

  if (!meta.openingBalance) {
    for (const line of lines.slice(0, 15)) {
      if (/opening|b\/f|brought forward/i.test(line.text)) {
        const amounts = findAmountTokens(line.text);
        if (amounts.length) meta.openingBalance = amounts[amounts.length - 1].value;
      }
    }
  }

  return meta;
}

export function detectBankFromText(fullText: string): string | null {
  const lower = fullText.toLowerCase();
  if (/capitec/.test(lower)) return "capitec";
  if (/standard\s+bank|std\s+bank/.test(lower)) return "standard-bank";
  if (/\bfnb\b|first\s+national\s+bank/.test(lower)) return "fnb";
  if (/nedbank/.test(lower)) return "nedbank";
  if (/\bab\s*sa\b/.test(lower)) return "absa";
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
  lineIndex: number,
  previousDate?: string,
  contextYear?: number
): ParsedRow | null {
  if (SKIP_LINE.test(line.text)) return null;

  const dateToken = findDateToken(line.text);
  if (!dateToken) return null;

  const iso = parseStatementDate(dateToken, contextYear, previousDate);
  if (!iso) return null;

  let amountZAR: number | null = null;
  let balanceAfter: number | undefined;
  let needsReview = false;

  if (columns.debitX !== undefined && columns.creditX !== undefined) {
    const debitItem = columns.debitX !== undefined ? nearestItem(line.items, columns.debitX, 55) : null;
    const creditItem = columns.creditX !== undefined ? nearestItem(line.items, columns.creditX, 55) : null;
    const debit = debitItem ? parseAmountToken(debitItem.text) : null;
    const credit = creditItem ? parseAmountToken(creditItem.text) : null;
    if (debit !== null && Math.abs(debit) >= 0.01 && (credit === null || Math.abs(credit) < 0.01)) {
      amountZAR = -Math.abs(debit);
    } else if (credit !== null && Math.abs(credit) >= 0.01) {
      amountZAR = Math.abs(credit);
    }
    if (columns.balanceX !== undefined) {
      const balItem = nearestItem(line.items, columns.balanceX);
      if (balItem) balanceAfter = parseAmountToken(balItem.text) ?? undefined;
    }
  } else {
    const amounts = findAmountTokens(line.text);
    if (amounts.length === 0) return null;
    if (columns.balanceX !== undefined && amounts.length >= 2) {
      balanceAfter = amounts[amounts.length - 1].value;
      amountZAR = amounts[amounts.length - 2].value;
    } else {
      amountZAR = amounts[amounts.length - 1].value;
    }
  }

  if (amountZAR === null || amountZAR === 0) return null;

  const desc = line.text
    .replace(dateToken, "")
    .replace(/R?\s*-?\d[\d\s.,]*/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!desc || desc.length < 2) {
    needsReview = true;
  }

  return {
    date: iso,
    description: desc || "Transaction",
    amountZAR,
    balanceAfter,
    needsReview,
    lineIndex,
  };
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

  const rows: ParsedRow[] = [];
  let previousDate: string | undefined;

  lines.forEach((line, idx) => {
    const row = parseRowFromLine(line, columns, idx, previousDate, contextYear);
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
    const contextYearMatch = fullText.match(/\b(20\d{2})\b/);
    const templateRows = applyBankTemplate(bankId, lines, contextYearMatch ? +contextYearMatch[1] : undefined);
    rows = mergeTemplateRows(generic.rows, templateRows, bankId);
  }
  return { rows, bankHint: generic.bankHint, balances: generic.balances };
}
