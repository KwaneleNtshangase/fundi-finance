const MONTH_MAP: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

export function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

export function toIsoDate(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** Parse SA statement date tokens to ISO YYYY-MM-DD. */
export function parseStatementDate(
  token: string,
  contextYear?: number,
  previousIso?: string
): string | null {
  const t = token.trim();
  if (!t) return null;

  // YYYY-MM-DD
  const iso = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return toIsoDate(+iso[1], +iso[2], +iso[3]);

  // DD/MM/YYYY or DD-MM-YYYY
  const dmy4 = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy4) return toIsoDate(+dmy4[3], +dmy4[2], +dmy4[1]);

  // DD/MM/YY or DD-MM-YY
  const dmy2 = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (dmy2) {
    const yy = +dmy2[3];
    const y = yy >= 70 ? 1900 + yy : 2000 + yy;
    return toIsoDate(y, +dmy2[2], +dmy2[1]);
  }

  // DD Mon YYYY (e.g. 01 May 2026)
  const dMonY = t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})\s+(\d{4})$/);
  if (dMonY) {
    const m = MONTH_MAP[dMonY[2].slice(0, 3).toLowerCase()];
    if (m) return toIsoDate(+dMonY[3], m, +dMonY[1]);
  }

  // DD Mon (year inferred)
  const dMon = t.match(/^(\d{1,2})\s+([A-Za-z]{3,9})$/);
  if (dMon) {
    const m = MONTH_MAP[dMon[2].slice(0, 3).toLowerCase()];
    if (!m) return null;
    let y = contextYear ?? (previousIso ? +previousIso.slice(0, 4) : new Date().getFullYear());
    if (previousIso) {
      const prevM = +previousIso.slice(5, 7);
      if (m < prevM - 6) y += 1;
      if (m > prevM + 6) y -= 1;
    }
    return toIsoDate(y, m, +dMon[1]);
  }

  return null;
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const aMs = Date.UTC(ay, am - 1, ad);
  const bMs = Date.UTC(by, bm - 1, bd);
  return Math.abs(Math.floor((bMs - aMs) / 86_400_000));
}

/** Find date-like token in a line of text. */
export function findDateToken(text: string): string | null {
  const patterns = [
    /\b\d{4}-\d{2}-\d{2}\b/,
    /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
    /\b\d{1,2}\s+[A-Za-z]{3,9}(?:\s+\d{4})?\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0];
  }
  return null;
}

/** Infer statement year — FNB uses Statement Period; others use first 20xx token. */
export function extractContextYear(fullText: string, bankId?: string | null): number | undefined {
  if (bankId === "fnb") {
    const periodEnd = fullText.match(
      /statement\s+period\s*:?\s*\d{1,2}\s+\w+\s+\d{4}\s+to\s+\d{1,2}\s+\w+\s+(\d{4})/i
    );
    if (periodEnd) return +periodEnd[1];
    const periodStart = fullText.match(
      /statement\s+period\s*:?\s*\d{1,2}\s+\w+\s+(\d{4})/i
    );
    if (periodStart) return +periodStart[1];
  }
  const m = fullText.match(/\b(20\d{2})\b/);
  return m ? +m[1] : undefined;
}
