import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it, vi } from "vitest";
import { parseStatementDate, findDateToken, daysBetween } from "../parsers/pdfDates";
import { parseAmountToken, parseFnbAmountToken, findAmountTokens } from "../parsers/pdfLayout";
import { parseLayoutFixture, detectBankFromText } from "../parsers/pdfGeneric";
import { reconcileBalanceChain, reconcileTransactions } from "../reconciliation";
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

  it("parses comma thousands", () => {
    expect(parseAmountToken("1,077.04")).toBe(1077.04);
  });

  it("parses FNB Cr/Dr amounts", () => {
    expect(parseFnbAmountToken("901.00Cr")).toBe(901);
    expect(parseFnbAmountToken("500.00")).toBe(-500);
    expect(parseFnbAmountToken("25,468.00Cr")).toBe(25468);
    expect(parseFnbAmountToken("892.38Cr")).toBe(892.38);
  });

  it("finds multiple amounts on a line", () => {
    const amounts = findAmountTokens("01/05/2026 SHOP 250.00 4750.00");
    expect(amounts.length).toBeGreaterThanOrEqual(2);
  });
});

describe("bank layout fixtures", () => {
  it("parses Capitec real-layout fixture with reconciliation", () => {
    const fixture = loadLayout("pdf-capitec.layout.json");
    const { rows, bankHint, balances } = parseLayoutFixture(fixture);
    expect(bankHint).toBe("capitec");
    expect(rows).toHaveLength(6);
    expect(rows.some((r) => r.amountZAR > 0)).toBe(true);
    expect(rows.some((r) => r.amountZAR < 0)).toBe(true);
    // Long reference numbers are deliberately trimmed from descriptions
    // (import UX change) - assert they no longer leak through.
    expect(rows.some((r) => r.description.includes("2474439413"))).toBe(false);
    expect(rows.filter((r) => r.description === "Bank Charges")).toHaveLength(2);
    expect(rows.find((r) => r.description.includes("Snapscan"))?.amountZAR).toBe(9.66);
    expect(rows.find((r) => r.description.includes("Uber"))?.amountZAR).toBe(-60);
    expect(rows.find((r) => r.description.includes("Alex M"))?.amountZAR).toBe(-2814.93);
    const chain = reconcileBalanceChain(
      rows.map((r) => ({
        date: r.date,
        description: r.description,
        amountZAR: r.amountZAR,
        balanceAfter: r.balanceAfter,
        lineIndex: r.lineIndex,
      })),
      balances.openingBalance!,
      balances.closingBalance!
    );
    expect(chain.ok).toBe(true);
    expect(chain.warnings).toContain("Balance reconciles ✓");
    expect(rows.some((r) => r.description.includes("Netflix"))).toBe(false);
    expect(rows.some((r) => r.description.includes("Gogo Dstv Recurring"))).toBe(false);
    expect(rows.some((r) => /page\s+\d+\s+of/i.test(r.description))).toBe(false);
    expect(rows.some((r) => /summary|scheduled/i.test(r.description))).toBe(false);
  });

  it("parses FNB ZAR layout with Cr/Dr amounts and balance chain", () => {
    const fixture = loadLayout("pdf-fnb.layout.json");
    const { rows, bankHint, balances } = parseLayoutFixture(fixture);
    expect(bankHint).toBe("fnb");
    expect(rows.length).toBe(9);
    expect(rows.some((r) => r.amountZAR > 0)).toBe(true);
    expect(rows.some((r) => r.amountZAR < 0)).toBe(true);
    expect(rows.find((r) => r.description.includes("Magtape"))?.amountZAR).toBe(198);
    expect(rows.find((r) => r.description.includes("Internal Debit"))?.amountZAR).toBe(-198);
    expect(rows.find((r) => r.description.includes("Transfer"))?.amountZAR).toBe(901);
    expect(rows.find((r) => r.description.includes("1,077") || r.description.includes("Transfer"))?.amountZAR).toBe(901);
    expect(rows.find((r) => r.description.includes("Merchant"))?.amountZAR).toBe(-500);
    expect(rows.find((r) => r.description.includes("School Fees"))?.amountZAR).toBe(25468);
    expect(rows.find((r) => r.description.includes("Savings"))?.amountZAR).toBe(-25000);
    expect(rows[0].date).toBe("2026-04-01");
    expect(rows.some((r) => r.description.includes("Decoy"))).toBe(false);
    // Trailing reference blobs are deliberately trimmed from descriptions.
    expect(rows.some((r) => r.description.includes("R25853"))).toBe(false);
    const chain = reconcileBalanceChain(
      rows.map((r) => ({
        date: r.date,
        description: r.description,
        amountZAR: r.amountZAR,
        balanceAfter: r.balanceAfter,
        lineIndex: r.lineIndex,
      })),
      balances.openingBalance!,
      balances.closingBalance!
    );
    expect(chain.ok).toBe(true);
    expect(chain.warnings).toContain("Balance reconciles ✓");
  });

  it("parses FNB without Transaction History heading (regression)", () => {
    const fixture = loadLayout("pdf-fnb.layout.json");
    expect(fixture.headerText).not.toMatch(/transaction\s+history/i);
    const { rows } = parseLayoutFixture(fixture);
    expect(rows.length).toBeGreaterThan(0);
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
    expect(detectBankFromText("First National Bank")).toBe("fnb");
    expect(detectBankFromText("statement from fnb.co.za")).toBe("fnb");
    // Bare bank words no longer match: transaction descriptions routinely
    // name OTHER banks, which mis-routed the parser (header-only detection).
    expect(detectBankFromText("FNB account")).toBeNull();
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
  it("template parser extracts Capitec rows only under Transaction History", () => {
    const fixture = loadLayout("pdf-capitec.layout.json");
    const items = fixture.lines.flatMap(
      (l: { y: number; page?: number; items: { x: number; text: string }[] }) =>
        l.items.map((i: { x: number; text: string }) => ({
          text: i.text,
          x: i.x,
          y: l.y,
          page: l.page ?? 1,
        }))
    );
    const lines = groupItemsIntoLines(items);
    const rows = applyBankTemplate("capitec", lines, 2025);
    expect(rows.length).toBe(6);
    expect(rows.some((r) => r.description.includes("Netflix"))).toBe(false);
  });

  it("template parser extracts FNB rows under Transactions in RAND section", () => {
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
    const lines = groupItemsIntoLines(items);
    const fullText = fixture.headerText ?? "";
    const yearMatch = fullText.match(/to\s+\d{1,2}\s+\w+\s+(\d{4})/i);
    const rows = applyBankTemplate("fnb", lines, yearMatch ? +yearMatch[1] : 2026);
    expect(rows.length).toBe(9);
    expect(rows.some((r) => r.description.includes("Decoy"))).toBe(false);
  });

  it("parses Discovery Date/Type/Details/Amount layout with correct signs", () => {
    const fixture = loadLayout("pdf-discovery.layout.json");
    const items = fixture.lines.flatMap(
      (l: { y: number; page?: number; items: { x: number; text: string }[] }) =>
        l.items.map((i: { x: number; text: string }) => ({
          text: i.text,
          x: i.x,
          y: l.y,
          page: l.page ?? 1,
        }))
    );
    const lines = groupItemsIntoLines(items);
    const rows = applyBankTemplate("discovery", lines, 2024);
    expect(rows.length).toBe(5);
    const byDesc = Object.fromEntries(rows.map((r) => [r.description, r.amountZAR]));
    // Credits stay positive, debits (leading "-") go negative, and the "1.00%"
    // interest rate is never mistaken for the R0.07 amount.
    expect(byDesc["THEMBEKA FNB"]).toBe(300); // last write wins; both are +
    expect(byDesc["Interest Earned at 1.00%"]).toBe(0.07);
    expect(byDesc["Monthly Account fee"]).toBe(-14.5);
    expect(byDesc["Vitality Money Premium"]).toBe(-9.67);
    const sum = rows.reduce((s, r) => s + r.amountZAR, 0);
    expect(Math.round(sum * 100)).toBe(32590); // opening 0 + sum = closing 325.90
  });

  it("detects Discovery bank and reconciles on signed sum", () => {
    const fixture = loadLayout("pdf-discovery.layout.json");
    const parsed = parseLayoutFixture(fixture);
    expect(parsed.bankHint).toBe("discovery");
    expect(parsed.rows.length).toBe(5);
  });
});
