import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { parseStatementDate, findDateToken, daysBetween } from "../parsers/pdfDates";
import { parseAmountToken, findAmountTokens } from "../parsers/pdfLayout";
import { parseLayoutFixture, detectBankFromText } from "../parsers/pdfGeneric";
import { applyBankTemplate } from "../parsers/pdfTemplates";
import { groupItemsIntoLines } from "../parsers/pdfLayout";
import { parsePdfStatement } from "../parsers/pdf";
import * as pdfText from "../parsers/pdfText";

const fixtures = join(__dirname, "fixtures");

function loadLayout(name: string) {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8"));
}

describe("pdfDates", () => {
  it("parses DD/MM/YYYY", () => {
    expect(parseStatementDate("01/05/2026")).toBe("2026-05-01");
  });

  it("parses YYYY-MM-DD", () => {
    expect(parseStatementDate("2026-05-01")).toBe("2026-05-01");
  });

  it("parses DD Mon YYYY", () => {
    expect(parseStatementDate("01 May 2026")).toBe("2026-05-01");
  });

  it("infers year across boundary from previous date", () => {
    expect(parseStatementDate("02 Jan", 2025, "2025-12-31")).toBe("2026-01-02");
  });

  it("findDateToken in line text", () => {
    expect(findDateToken("15/06/2026 WOOLWORTHS -250")).toBe("15/06/2026");
  });

  it("daysBetween", () => {
    expect(daysBetween("2026-06-01", "2026-06-03")).toBe(2);
  });
});

describe("pdfLayout amounts", () => {
  it("parses SA amounts with spaces", () => {
    expect(parseAmountToken("1 234.56")).toBe(1234.56);
  });

  it("parses parenthetical negatives", () => {
    expect(parseAmountToken("(250.00)")).toBe(-250);
  });

  it("finds multiple amounts on a line", () => {
    const amounts = findAmountTokens("01/05/2026 SHOP 250.00 4750.00");
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("bank layout fixtures", () => {
  it("parses Capitec synthetic layout", () => {
    const fixture = loadLayout("pdf-capitec.layout.json");
    const { rows, bankHint } = parseLayoutFixture(fixture);
    expect(bankHint).toBe("capitec");
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.some((r) => r.amountZAR < 0)).toBe(true);
    expect(rows.some((r) => r.amountZAR > 0)).toBe(true);
  });

  it("parses FNB synthetic layout with signed amounts", () => {
    const fixture = loadLayout("pdf-fnb.layout.json");
    const { rows, bankHint } = parseLayoutFixture(fixture);
    expect(bankHint).toBe("fnb");
    expect(rows[0].date).toBe("2026-05-01");
    expect(rows[0].amountZAR).toBe(-150);
  });

  it("parses Standard Bank debit/credit layout", () => {
    const fixture = loadLayout("pdf-standard-bank.layout.json");
    const { rows, bankHint } = parseLayoutFixture(fixture);
    expect(bankHint).toBe("standard-bank");
    expect(rows.some((r) => r.amountZAR < 0)).toBe(true);
    expect(rows.some((r) => r.amountZAR > 0)).toBe(true);
  });

  it("generic signed-amount layout", () => {
    const fixture = loadLayout("pdf-generic-signed.layout.json");
    const { rows } = parseLayoutFixture(fixture);
    expect(rows).toHaveLength(2);
    expect(rows[0].amountZAR).toBe(-45);
    expect(rows[1].amountZAR).toBe(45);
  });

  it("generic debit/credit columns with year boundary", () => {
    const fixture = loadLayout("pdf-generic-debit-credit.layout.json");
    const { rows } = parseLayoutFixture(fixture);
    expect(rows[0].date).toBe("2025-12-01");
    expect(rows[1].date).toBe("2026-01-02");
    expect(rows[1].amountZAR).toBeGreaterThan(0);
  });
});

describe("bank detection", () => {
  it("detects banks from header text", () => {
    expect(detectBankFromText("Capitec Bank Statement")).toBe("capitec");
    expect(detectBankFromText("FNB account")).toBe("fnb");
    expect(detectBankFromText("Standard Bank")).toBe("standard-bank");
    expect(detectBankFromText("Unknown Credit Union")).toBeNull();
  });
});

describe("parsePdfStatement integration", () => {
  it("returns needsPassword for encrypted PDF", async () => {
    vi.spyOn(pdfText, "extractPdfText").mockResolvedValueOnce({ ok: false, kind: "needsPassword" });
    const result = await parsePdfStatement(new Uint8Array([1, 2, 3]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("needsPassword");
    vi.restoreAllMocks();
  });

  it("returns scanned error for image-only PDF", async () => {
    vi.spyOn(pdfText, "extractPdfText").mockResolvedValueOnce({ ok: false, kind: "scanned" });
    const result = await parsePdfStatement(new Uint8Array([1, 2, 3]));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.kind).toBe("scanned");
    vi.restoreAllMocks();
  });

  it("parses extracted text via generic pipeline", async () => {
    const fixture = loadLayout("pdf-fnb.layout.json");
    const items = fixture.lines.flatMap(
      (l: { y: number; page?: number; items: { x: number; text: string }[] }) =>
        l.items.map((i: { x: number; text: string }) => ({
          text: i.text,
          x: i.x,
          y: l.y,
          page: l.page ?? 1,
        }))
    );
    const fullText = fixture.headerText + " " + fixture.lines.map((l: { items: { text: string }[] }) => l.items.map((i: { text: string }) => i.text).join(" ")).join(" ");
    vi.spyOn(pdfText, "extractPdfText").mockResolvedValueOnce({
      ok: true,
      items,
      fullText,
      pageCount: 1,
    });
    const result = await parsePdfStatement(new Uint8Array([1]), { fileName: "fnb.pdf" });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.bankHint).toBe("fnb");
      expect(result.transactions.length).toBeGreaterThan(0);
      expect(result.accountLabel).toBe("FNB");
    }
    vi.restoreAllMocks();
  });

  it("flags low confidence when no balances", async () => {
    const fixture = loadLayout("pdf-generic-signed.layout.json");
    const items = fixture.lines.flatMap(
      (l: { y: number; items: { x: number; text: string }[] }) =>
        l.items.map((i: { x: number; text: string }) => ({ text: i.text, x: i.x, y: l.y, page: 1 }))
    );
    vi.spyOn(pdfText, "extractPdfText").mockResolvedValueOnce({
      ok: true,
      items,
      fullText: "Generic Bank " + items.map((i: { text: string }) => i.text).join(" "),
      pageCount: 1,
    });
    const result = await parsePdfStatement(new Uint8Array([1]));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.lowConfidence).toBe(true);
    vi.restoreAllMocks();
  });
});

describe("applyBankTemplate", () => {
  it("template parser extracts rows from grouped lines", () => {
    const fixture = loadLayout("pdf-capitec.layout.json");
    const items = fixture.lines.flatMap(
      (l: { y: number; items: { x: number; text: string }[] }) =>
        l.items.map((i: { x: number; text: string }) => ({ text: i.text, x: i.x, y: l.y, page: 1 }))
    );
    const lines = groupItemsIntoLines(items);
    const rows = applyBankTemplate("capitec", lines, 2026);
    expect(rows.length).toBeGreaterThan(0);
  });
});
