import { getDocumentProxy, getResolvedPDFJS } from "unpdf";
import type { PositionedItem, TextLine } from "./pdfLayout";

export type PdfExtractResult =
  | { ok: true; items: PositionedItem[]; fullText: string; pageCount: number }
  | { ok: false; kind: "needsPassword" }
  | { ok: false; kind: "scanned" }
  | { ok: false; kind: "error"; message: string };

type TextContentItem = {
  str?: string;
  transform?: number[];
};

async function mapPasswordError(err: unknown): Promise<PdfExtractResult | null> {
  const e = err as { name?: string; code?: number };
  if (e.name !== "PasswordException") return null;
  const pdfjs = await getResolvedPDFJS();
  if (e.code === pdfjs.PasswordResponses.NEED_PASSWORD) {
    return { ok: false, kind: "needsPassword" };
  }
  return { ok: false, kind: "error", message: "Incorrect PDF password." };
}

/** Extract positioned text from a PDF buffer (in memory only; unpdf serverless build - no worker file). */
export async function extractPdfText(
  buffer: Uint8Array,
  password?: string
): Promise<PdfExtractResult> {
  try {
    const data = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(data, {
      password: password ?? "",
      useSystemFonts: true,
      disableFontFace: true,
    });

    const items: PositionedItem[] = [];
    const textParts: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      for (const raw of content.items as TextContentItem[]) {
        const t = raw.str?.trim();
        if (!t) continue;
        const x = raw.transform?.[4] ?? 0;
        const y = raw.transform?.[5] ?? 0;
        items.push({ text: t, x, y, page: p });
        textParts.push(t);
      }
    }

    const fullText = textParts.join(" ").replace(/\s+/g, " ").trim();
    if (items.length === 0 || fullText.length < 20) {
      return { ok: false, kind: "scanned" };
    }

    return { ok: true, items, fullText, pageCount: pdf.numPages };
  } catch (err) {
    const passwordResult = await mapPasswordError(err);
    if (passwordResult) return passwordResult;
    return {
      ok: false,
      kind: "error",
      message: err instanceof Error ? err.message : "PDF extraction failed",
    };
  }
}

/** Re-export for tests that inject layout lines directly. */
export type { TextLine, PositionedItem };
