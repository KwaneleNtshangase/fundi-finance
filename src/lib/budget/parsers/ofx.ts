import type { NormalizedTxn, ParseStatementResult } from "../types";
import { reconcileTransactions } from "../reconciliation";

function textContent(el: Element | null): string {
  return el?.textContent?.trim() ?? "";
}

function parseOfxAmount(raw: string): number {
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Minimal OFX 1.x SGML/XML parser - no external dependency. */
export function parseOfxStatement(text: string): ParseStatementResult {
  const transactions: NormalizedTxn[] = [];
  let lineIndex = 0;

  // Strip OFX header if present
  const body = text.includes("<OFX>") ? text.slice(text.indexOf("<OFX>")) : text;

  const stmtTrnRegex = /<STMTTRN>([\s\S]*?)<\/STMTTRN>/gi;
  let match: RegExpExecArray | null;
  while ((match = stmtTrnRegex.exec(body)) !== null) {
    const block = match[1];
    const get = (tag: string) => {
      const m = block.match(new RegExp(`<${tag}>([^<\\r\\n]+)`, "i"));
      return m?.[1]?.trim() ?? "";
    };

    const fitId = get("FITID");
    const dateRaw = get("DTPOSTED") || get("DTUSER");
    const date =
      dateRaw.length >= 8
        ? `${dateRaw.slice(0, 4)}-${dateRaw.slice(4, 6)}-${dateRaw.slice(6, 8)}`
        : "";
    const amountRaw = get("TRNAMT");
    const amountZAR = parseOfxAmount(amountRaw);
    const description = get("NAME") || get("MEMO") || get("PAYEE");

    if (!date || !description || amountZAR === 0) continue;

    transactions.push({
      date,
      description,
      amountZAR,
      rawMerchant: description,
      externalId: fitId || undefined,
      lineIndex: lineIndex++,
    });
  }

  const reconciliation = reconcileTransactions(transactions);

  return {
    fileType: "ofx",
    bankHint: "ofx",
    transactions,
    reconciliation,
  };
}
