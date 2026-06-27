import type { ParseStatementResult, StatementFileType } from "../types";
import { parseCsvStatement } from "./csv";
import { parseOfxStatement } from "./ofx";

export { parsePdfStatement, SCANNED_MESSAGE } from "./pdf";

export function parseStatement(
  content: string,
  fileType: StatementFileType
): ParseStatementResult {
  if (fileType === "csv") return parseCsvStatement(content);
  if (fileType === "ofx") return parseOfxStatement(content);
  if (fileType === "pdf") {
    throw new Error("PDF parsing requires parsePdfStatement(buffer) - use the API route.");
  }
  throw new Error(`Unsupported file type: ${fileType}`);
}

export function inferFileType(fileName: string, mimeType?: string): StatementFileType | null {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv") || mimeType === "text/csv") return "csv";
  if (lower.endsWith(".ofx") || lower.endsWith(".qfx") || mimeType?.includes("ofx")) return "ofx";
  if (lower.endsWith(".pdf")) return "pdf";
  return null;
}
