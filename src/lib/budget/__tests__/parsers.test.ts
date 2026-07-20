import { readFileSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";
import { parseCsvStatement } from "../parsers/csv";
import { parseOfxStatement } from "../parsers/ofx";

const fixtures = join(__dirname, "fixtures");

describe("CSV parsers", () => {
  it("parses FNB-style export", () => {
    const text = readFileSync(join(fixtures, "fnb-sample.csv"), "utf8");
    const result = parseCsvStatement(text);
    expect(result.bankHint).toBe("fnb");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0].amountZAR).toBe(-150);
    expect(result.reconciliation.parsedCount).toBe(3);
  });

  it("parses Capitec-style export with DD/MM/YYYY", () => {
    const text = readFileSync(join(fixtures, "capitec-sample.csv"), "utf8");
    const result = parseCsvStatement(text);
    expect(result.bankHint).toBe("capitec");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0].date).toBe("2026-05-01");
    expect(result.transactions[0].amountZAR).toBe(-250);
  });

  it("parses Standard Bank debit/credit columns", () => {
    const text = readFileSync(join(fixtures, "standard-bank-sample.csv"), "utf8");
    const result = parseCsvStatement(text);
    expect(result.bankHint).toBe("standard-bank");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[0].amountZAR).toBe(-320.5);
    expect(result.transactions[1].amountZAR).toBe(15000);
  });

  it("parses Nedbank signed amount column", () => {
    const text = readFileSync(join(fixtures, "nedbank-sample.csv"), "utf8");
    const result = parseCsvStatement(text);
    expect(result.bankHint).toBe("nedbank");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[2].amountZAR).toBe(-45);
  });

  it("parses Absa debit/credit columns", () => {
    const text = readFileSync(join(fixtures, "absa-sample.csv"), "utf8");
    const result = parseCsvStatement(text);
    expect(result.bankHint).toBe("absa");
    expect(result.transactions).toHaveLength(3);
    expect(result.transactions[2].amountZAR).toBe(-199);
  });
});

describe("OFX parser", () => {
  it("parses STMTTRN blocks", () => {
    const ofx = `<?xml version="1.0"?>
<OFX><BANKMSGSRSV1><STMTTRNRS><STMTRS><BANKTRANLIST>
<STMTTRN><TRNTYPE>DEBIT</TRNTYPE><DTPOSTED>20260501120000</DTPOSTED><TRNAMT>-45.00</TRNAMT><FITID>1</FITID><NAME>PICK N PAY</NAME></STMTTRN>
<STMTTRN><TRNTYPE>CREDIT</TRNTYPE><DTPOSTED>20260502120000</DTPOSTED><TRNAMT>5000.00</TRNAMT><FITID>2</FITID><NAME>SALARY</NAME></STMTTRN>
</BANKTRANLIST></STMTRS></STMTTRNRS></BANKMSGSRSV1></OFX>`;
    const result = parseOfxStatement(ofx);
    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0].externalId).toBe("1");
  });
});
