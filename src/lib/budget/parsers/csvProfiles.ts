import type { NormalizedTxn } from "../types";

export type BankColumnMap = {
  date: string;
  description: string;
  amount?: string;
  debit?: string;
  credit?: string;
  balance?: string;
};

const BANK_PROFILES: { id: string; headers: string[]; map: BankColumnMap }[] = [
  {
    id: "fnb",
    headers: ["date", "amount", "balance", "description"],
    map: { date: "date", description: "description", amount: "amount", balance: "balance" },
  },
  {
    id: "standard-bank",
    headers: ["date", "description", "debit", "credit", "balance"],
    map: { date: "date", description: "description", debit: "debit", credit: "credit", balance: "balance" },
  },
  {
    id: "capitec",
    headers: ["date", "description", "money in", "money out", "balance"],
    map: { date: "date", description: "description", debit: "money out", credit: "money in", balance: "balance" },
  },
  {
    id: "nedbank",
    headers: ["date", "description", "amount", "balance"],
    map: { date: "date", description: "description", amount: "amount", balance: "balance" },
  },
  {
    id: "absa",
    headers: ["date", "description", "debit amount", "credit amount", "balance"],
    map: { date: "date", description: "description", debit: "debit amount", credit: "credit amount", balance: "balance" },
  },
];

function normaliseHeader(h: string): string {
  return h.trim().toLowerCase();
}

export function detectBankProfile(headers: string[]): { id: string; map: BankColumnMap } | null {
  const norm = headers.map(normaliseHeader);
  for (const profile of BANK_PROFILES) {
    const required = profile.headers.map(normaliseHeader);
    if (!required.every((h) => norm.includes(h))) continue;

    const indices = required.map((h) => norm.indexOf(h));
    const ordered = indices.every((idx, i) => i === 0 || idx > indices[i - 1]);
    if (!ordered) continue;

    const map: BankColumnMap = { date: "", description: "" };
    for (const [key, label] of Object.entries(profile.map)) {
      const idx = norm.indexOf(normaliseHeader(label));
      if (idx >= 0) {
        (map as Record<string, string>)[key] = headers[idx];
      }
    }
    return { id: profile.id, map };
  }
  return null;
}

function parseSaDate(raw: string): string | null {
  const s = raw.trim();
  // YYYY-MM-DD or YYYY/MM/DD
  const iso = s.match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = s.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  return null;
}

function parseAmount(raw: string | undefined): number | null {
  if (raw == null || raw.trim() === "") return null;
  const cleaned = raw.replace(/[R\s]/gi, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

export function mapCsvRowToTxn(
  row: Record<string, string>,
  map: BankColumnMap,
  lineIndex: number
): NormalizedTxn | null {
  const date = parseSaDate(row[map.date] ?? "");
  if (!date) return null;

  const description = (row[map.description] ?? "").trim();
  if (!description) return null;

  let amountZAR: number | null = null;
  if (map.amount && row[map.amount]) {
    amountZAR = parseAmount(row[map.amount]);
  } else if (map.debit || map.credit) {
    const debitRaw = parseAmount(map.debit ? row[map.debit] : undefined);
    const creditRaw = parseAmount(map.credit ? row[map.credit] : undefined);
    const debit = debitRaw != null ? Math.abs(debitRaw) : 0;
    const credit = creditRaw != null ? Math.abs(creditRaw) : 0;
    if (debit > 0 && credit > 0) return null;
    if (debit > 0) amountZAR = -debit;
    else if (credit > 0) amountZAR = credit;
    else return null;
  }
  if (amountZAR === null || amountZAR === 0) return null;

  const balanceRaw = map.balance ? row[map.balance] : undefined;
  const balanceAfter = balanceRaw ? parseAmount(balanceRaw) ?? undefined : undefined;

  return {
    date,
    description,
    amountZAR,
    rawMerchant: description.split(/\s{2,}| - /)[0].trim(),
    balanceAfter: balanceAfter ?? undefined,
    lineIndex,
  };
}
