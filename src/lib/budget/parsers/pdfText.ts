import type { PositionedItem, TextLine } from "./pdfLayout";

export type PdfExtractResult =
  | { ok: true; items: PositionedItem[]; fullText: string; pageCount: number }
  | { ok: false; kind: "needsPassword" }
  | { ok: false; kind: "scanned" }
  | { ok: false; kind: "error"; message: string };

type PdfJsModule = {
  getDocument: (params: {
    data: Uint8Array;
    password?: string;
    useSystemFonts?: boolean;
    disableFontFace?: boolean;
  }) => { promise: Promise<PdfDocument> };
  PasswordResponses: { NEED_PASSWORD: number; INCORRECT_PASSWORD: number };
};

type PdfDocument = {
  numPages: number;
  getPage: (n: number) => Promise<PdfPage>;
};

type PdfPage = {
  getTextContent: () => Promise<{ items: PdfTextItem[] }>;
};

type PdfTextItem = {
  str: string;
  transform: number[];
};

let pdfjsModule: PdfJsModule | null = null;

async function loadPdfJs(): Promise<PdfJsModule> {
  if (!pdfjsModule) {
    pdfjsModule = (await import("pdfjs-dist/build/pdf.mjs")) as unknown as PdfJsModule;
  }
  return pdfjsModule;
}

/** Extract positioned text from a PDF buffer (in memory only). */
export async function extractPdfText(
  buffer: Uint8Array,
  password?: string
): Promise<PdfExtractResult> {
  try {
    const pdfjs = await loadPdfJs();
    const loadingTask = pdfjs.getDocument({
      data: buffer,
      password: password ?? "",
      useSystemFonts: true,
      disableFontFace: true,
    });

    let pdf: PdfDocument;
    try {
      pdf = await loadingTask.promise;
    } catch (err: unknown) {
      const e = err as { name?: string; code?: number };
      if (e.name === "PasswordException") {
        if (e.code === pdfjs.PasswordResponses.NEED_PASSWORD) {
          return { ok: false, kind: "needsPassword" };
        }
        return { ok: false, kind: "error", message: "Incorrect PDF password." };
      }
      throw err;
    }

    const items: PositionedItem[] = [];
    const textParts: string[] = [];

    for (let p = 1; p <= pdf.numPages; p++) {
      const page = await pdf.getPage(p);
      const content = await page.getTextContent();
      for (const item of content.items) {
        const t = item.str?.trim();
        if (!t) continue;
        const x = item.transform[4] ?? 0;
        const y = item.transform[5] ?? 0;
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
    return {
      ok: false,
      kind: "error",
      message: err instanceof Error ? err.message : "PDF extraction failed",
    };
  }
}

/** Re-export for tests that inject layout lines directly. */
export type { TextLine, PositionedItem };
