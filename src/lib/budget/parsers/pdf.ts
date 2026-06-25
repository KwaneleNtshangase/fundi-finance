import type { NormalizedTxn, ParsePdfResult } from "../types";
import { reconcileBalanceChain, reconcileTransactions } from "../reconciliation";
import { extractPdfText } from "./pdfText";
import { groupItemsIntoLines } from "./pdfLayout";
import { extractContextYear } from "./pdfDates";
import {
  accountLabelFromBank,
  detectBankFromText,
  parseGenericPdfLayout,
} from "./pdfGeneric";
import {
  applyBankTemplate,
  BANK_TEMPLATES,
  mergeTemplateRows,
} from "./pdfTemplates";

const SCANNED_MESSAGE =
  "This looks like a scanned image — please upload the downloadable/text PDF or a CSV/OFX export from your bank.";

export async function parsePdfStatement(
  buffer: Uint8Array,
  options?: { password?: string; fileName?: string }
): Promise<ParsePdfResult> {
  const extracted = await extractPdfText(buffer, options?.password);

  if (!extracted.ok) {
    if (extracted.kind === "needsPassword") {
      return { ok: false, kind: "needsPassword" };
    }
    if (extracted.kind === "scanned") {
      return { ok: false, kind: "scanned" };
    }
    return { ok: false, kind: "error", message: extracted.message };
  }

  const { items, fullText } = extracted;
  const generic = parseGenericPdfLayout(items, fullText);
  const lines = groupItemsIntoLines(items);
  const bankId = generic.bankHint;
  const contextYear = extractContextYear(fullText, bankId);

  let rows = generic.rows;
  if (bankId && BANK_TEMPLATES.some((t) => t.id === bankId)) {
    const templateRows = applyBankTemplate(bankId, lines, contextYear);
    rows = mergeTemplateRows(generic.rows, templateRows, bankId);
  }

  const accountLabel = accountLabelFromBank(bankId ?? detectBankFromText(fullText), options?.fileName);

  const transactions: NormalizedTxn[] = rows.map((r) => ({
    date: r.date,
    description: r.description,
    amountZAR: r.amountZAR,
    rawMerchant: r.description,
    balanceAfter: r.balanceAfter,
    lineIndex: r.lineIndex,
    accountLabel,
  }));

  const hasBalanceMeta =
    generic.balances.openingBalance !== undefined &&
    generic.balances.closingBalance !== undefined;
  const lowConfidence = !hasBalanceMeta;

  let reconciliation =
    (bankId === "capitec" || bankId === "fnb") &&
    generic.balances.openingBalance !== undefined &&
    generic.balances.closingBalance !== undefined
      ? reconcileBalanceChain(
          transactions,
          generic.balances.openingBalance,
          generic.balances.closingBalance
        )
      : reconcileTransactions(transactions, {
          openingBalance: generic.balances.openingBalance,
          closingBalance: generic.balances.closingBalance,
        });

  if (lowConfidence && reconciliation.ok) {
    reconciliation.warnings.push(
      "No opening/closing balance found — review each transaction carefully."
    );
  }

  return {
    ok: true,
    fileType: "pdf",
    bankHint: bankId ?? undefined,
    accountLabel,
    transactions,
    reconciliation,
    lowConfidence,
  };
}

export { SCANNED_MESSAGE };
