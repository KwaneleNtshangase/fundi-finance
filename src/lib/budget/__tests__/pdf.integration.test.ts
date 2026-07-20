import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { extractPdfText } from "../parsers/pdfText";
import { parsePdfStatement } from "../parsers/pdf";

const pdfPath = join(__dirname, "fixtures", "fnb-sample.pdf");

describe("PDF extraction integration (real fixture, no mocks)", () => {
  function loadFixture(): Uint8Array {
    return new Uint8Array(readFileSync(pdfPath));
  }

  it("extractPdfText returns positioned text from a real PDF buffer", async () => {
    const result = await extractPdfText(loadFixture());
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.items.length).toBeGreaterThan(5);
    expect(result.items.every((i) => typeof i.x === "number" && typeof i.y === "number")).toBe(true);
    expect(result.fullText.toLowerCase()).toContain("fnb");
    expect(result.fullText).toContain("2026-05-01");
  });

  it("parsePdfStatement parses the real PDF end-to-end", async () => {
    const result = await parsePdfStatement(loadFixture(), { fileName: "fnb-sample.pdf" });
    if (!result.ok) {
      const detail =
        result.kind === "error" ? result.message : result.kind;
      expect.fail(`parsePdfStatement failed: ${detail}`);
    }
    expect(result.fileType).toBe("pdf");
    expect(result.bankHint).toBe("fnb");
    expect(result.transactions.length).toBeGreaterThan(0);
    expect(result.transactions.some((t) => t.amountZAR < 0)).toBe(true);
    expect(result.transactions.some((t) => t.amountZAR > 0)).toBe(true);
  });
});
