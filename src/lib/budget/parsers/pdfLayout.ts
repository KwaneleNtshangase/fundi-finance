/** Parse monetary amounts from SA bank statement text. */
export function parseAmountToken(raw: string): number | null {
  let s = raw.trim();
  if (!s || s === "-" || s === "—") return null;

  const paren = s.match(/^\(([\d\s.,]+)\)$/);
  if (paren) s = `-${paren[1]}`;

  s = s.replace(/\s/g, "").replace(/,/g, "");
  if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null;

  const n = Math.round(parseFloat(s) * 100) / 100;
  return Number.isFinite(n) ? n : null;
}

/** Find all amount-like tokens in text (requires 2dp - avoids date fragments). */
export function findAmountTokens(text: string): { value: number; index: number; raw: string }[] {
  const results: { value: number; index: number; raw: string }[] = [];
  const re = /(?:\([\d\s.,]+\)|-?\d{1,3}(?:[\s]\d{3})*\.\d{2}|-?\d+\.\d{2})/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const val = parseAmountToken(m[0]);
    if (val !== null && Math.abs(val) >= 0.01) {
      results.push({ value: val, index: m.index, raw: m[0] });
    }
  }
  return results;
}

export type PositionedItem = {
  text: string;
  x: number;
  y: number;
  page: number;
};

export type TextLine = {
  y: number;
  page: number;
  items: PositionedItem[];
  text: string;
};

export function groupItemsIntoLines(items: PositionedItem[], yTolerance = 3): TextLine[] {
  const sorted = [...items].sort((a, b) => a.page - b.page || a.y - b.y || a.x - b.x);
  const lines: TextLine[] = [];

  for (const item of sorted) {
    const t = item.text.trim();
    if (!t) continue;
    let line = lines.find(
      (l) => l.page === item.page && Math.abs(l.y - item.y) <= yTolerance
    );
    if (!line) {
      line = { y: item.y, page: item.page, items: [], text: "" };
      lines.push(line);
    }
    line.items.push(item);
    line.items.sort((a, b) => a.x - b.x);
    line.text = line.items.map((i) => i.text).join(" ").replace(/\s+/g, " ").trim();
  }

  return lines.sort((a, b) => a.page - b.page || a.y - b.y);
}

export type ColumnKind = "date" | "description" | "debit" | "credit" | "amount" | "balance" | "unknown";

export type ColumnRange = { x: number; tolerance?: number };

export type ColumnLayout = {
  date?: ColumnRange;
  description?: ColumnRange;
  category?: ColumnRange;
  moneyIn?: ColumnRange;
  moneyOut?: ColumnRange;
  fee?: ColumnRange;
  debit?: ColumnRange;
  credit?: ColumnRange;
  amount?: ColumnRange;
  balance?: ColumnRange;
  /** FNB accrued bank charges - informational, not part of running balance */
  accruedCharges?: ColumnRange;
};

export type ParsedRow = {
  date: string;
  description: string;
  amountZAR: number;
  balanceAfter?: number;
  needsReview?: boolean;
  lineIndex: number;
  /** Row failed per-step balance-chain check */
  balanceStepFailed?: boolean;
  /** Amount inferred without a clear in/out column */
  uncertainAmount?: boolean;
};

const DEFAULT_COL_TOLERANCE = 40;

export function itemNearColumn(item: PositionedItem, col?: ColumnRange): boolean {
  if (!col) return false;
  const tol = col.tolerance ?? DEFAULT_COL_TOLERANCE;
  return Math.abs(item.x - col.x) <= tol;
}

/** Assign each item to at most one column (nearest x wins). */
export function bucketItemsToColumns(
  line: TextLine,
  cols: ColumnLayout
): Map<keyof ColumnLayout, PositionedItem[]> {
  const keys = Object.keys(cols) as (keyof ColumnLayout)[];
  const buckets = new Map<keyof ColumnLayout, PositionedItem[]>();
  for (const k of keys) buckets.set(k, []);

  for (const item of line.items) {
    let bestKey: keyof ColumnLayout | null = null;
    let bestDist = Infinity;
    for (const k of keys) {
      const col = cols[k];
      if (!col) continue;
      const dist = Math.abs(item.x - col.x);
      const tol = col.tolerance ?? DEFAULT_COL_TOLERANCE;
      if (dist <= tol && dist < bestDist) {
        bestDist = dist;
        bestKey = k;
      }
    }
    if (bestKey) buckets.get(bestKey)!.push(item);
  }
  return buckets;
}

export function amountFromBucket(
  buckets: Map<keyof ColumnLayout, PositionedItem[]>,
  key: keyof ColumnLayout
): number | null {
  const items = buckets.get(key) ?? [];
  for (const item of items) {
    const val = parseAmountToken(item.text);
    if (val !== null && Math.abs(val) >= 0.01) return val;
  }
  return null;
}

export function textFromBucket(
  buckets: Map<keyof ColumnLayout, PositionedItem[]>,
  key: keyof ColumnLayout
): string {
  return (buckets.get(key) ?? []).map((i) => i.text).join(" ").trim();
}

export function itemsInColumn(line: TextLine, col?: ColumnRange): PositionedItem[] {
  if (!col) return [];
  return line.items.filter((i) => itemNearColumn(i, col));
}

export function textInColumn(line: TextLine, col?: ColumnRange): string {
  return itemsInColumn(line, col)
    .map((i) => i.text)
    .join(" ")
    .trim();
}

export function amountInColumn(line: TextLine, col?: ColumnRange): number | null {
  const items = itemsInColumn(line, col);
  for (const item of items) {
    const val = parseAmountToken(item.text);
    if (val !== null && Math.abs(val) >= 0.01) return val;
  }
  return null;
}

export function isDateToken(text: string): boolean {
  return /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/.test(text.trim());
}

/** DD Mon, DD Mon YY, or DD Mon YYYY (FNB, Standard Bank, and similar) */
export function isDMonDateToken(text: string): boolean {
  return /^\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{2,4})?$/.test(text.trim());
}

export function isStatementDateToken(text: string): boolean {
  return isDateToken(text) || isDMonDateToken(text);
}

/**
 * FNB Amount/Balance token: comma thousands + optional Cr/Dr suffix.
 * Cr → positive (credit/in), no suffix or Dr → negative (debit/out).
 */
export function parseFnbAmountToken(raw: string): number | null {
  const t = raw.trim().replace(/\s+/g, "");
  if (!t) return null;
  const m = t.match(/^([\d,]+(?:\.\d{2})?)(Cr|Dr)?$/i);
  if (!m) return null;
  if (!m[2] && !/\.\d{2}$/.test(m[1])) return null;
  const num = parseAmountToken(m[1]);
  if (num === null) return null;
  const suffix = m[2]?.toLowerCase();
  if (suffix === "cr") return Math.abs(num);
  if (suffix === "dr") return -Math.abs(num);
  return -Math.abs(num);
}

export function fnbAmountFromBucket(
  buckets: Map<keyof ColumnLayout, PositionedItem[]>,
  key: keyof ColumnLayout
): number | null {
  const items = buckets.get(key) ?? [];
  for (const item of items) {
    const val = parseFnbAmountToken(item.text);
    if (val !== null && Math.abs(val) >= 0.01) return val;
  }
  return null;
}

export function fnbBalanceFromBucket(
  buckets: Map<keyof ColumnLayout, PositionedItem[]>,
  key: keyof ColumnLayout
): number | null {
  const items = buckets.get(key) ?? [];
  for (const item of items) {
    const val = parseFnbAmountToken(item.text);
    if (val !== null) return val;
  }
  return null;
}

export function dateTokenInColumn(line: TextLine, dateCol?: ColumnRange): string | null {
  for (const item of itemsInColumn(line, dateCol)) {
    if (isStatementDateToken(item.text)) return item.text.trim();
  }
  return null;
}

/** Infer x-position column boundaries from amount clusters on sample lines. */
export function inferAmountColumns(lines: TextLine[]): {
  debitX?: number;
  creditX?: number;
  amountX?: number;
  balanceX?: number;
} {
  const amountXs: number[] = [];
  for (const line of lines) {
    for (const item of line.items) {
      if (parseAmountToken(item.text) !== null) {
        amountXs.push(item.x);
      }
    }
  }
  if (amountXs.length === 0) return {};

  amountXs.sort((a, b) => a - b);
  const clusters: number[][] = [];
  for (const x of amountXs) {
    const last = clusters[clusters.length - 1];
    if (last && x - last[last.length - 1] < 40) last.push(x);
    else clusters.push([x]);
  }
  const centroids = clusters.map((c) => c.reduce((s, v) => s + v, 0) / c.length);

  if (centroids.length >= 3) {
    return {
      debitX: centroids[centroids.length - 3],
      creditX: centroids[centroids.length - 2],
      balanceX: centroids[centroids.length - 1],
    };
  }
  if (centroids.length === 2) {
    return { amountX: centroids[0], balanceX: centroids[1] };
  }
  return { amountX: centroids[0] };
}

export function nearestItem(
  items: PositionedItem[],
  targetX: number,
  tolerance = 55
): PositionedItem | null {
  const withAmount = items.filter((i) => parseAmountToken(i.text) !== null);
  if (withAmount.length === 0) return null;
  const best = withAmount.reduce((b, item) =>
    Math.abs(item.x - targetX) < Math.abs(b.x - targetX) ? item : b
  );
  if (Math.abs(best.x - targetX) > tolerance) return null;
  return best;
}
