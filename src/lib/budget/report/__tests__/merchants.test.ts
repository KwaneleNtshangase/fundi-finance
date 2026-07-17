import { describe, expect, it } from "vitest";
import { cleanMerchantName, merchantKey } from "../merchants";

describe("cleanMerchantName", () => {
  it("strips embedded amounts and fee suffixes", () => {
    expect(cleanMerchantName("Samke-22,000.00 Fee: Paysha")).toBe("Samke");
    expect(cleanMerchantName("Mama Coka Imizamo-5,500.00 Fee: Payshap Sent R7.50")).toBe(
      "Mama Coka Imizamo"
    );
  });

  it("strips ELECT / reference / long-number suffixes", () => {
    expect(cleanMerchantName("DALITSO GROUP-15,000.00 ELECT")).toBe("Dalitso Group");
    expect(cleanMerchantName("Woolworths REF 998877665544")).toBe("Woolworths");
  });

  it("strips bank channel prefixes", () => {
    expect(cleanMerchantName("FNB App Payment To Gogo Zwane")).toBe("Gogo Zwane");
    expect(cleanMerchantName("POS Purchase Checkers Sixty60")).toBe("Checkers Sixty60");
    expect(cleanMerchantName("Payshap payment to Thabo")).toBe("Thabo");
  });

  it("title-cases and collapses whitespace", () => {
    expect(cleanMerchantName("  boxer   superstore umlazi ")).toBe("Boxer Superstore Umlazi");
  });

  it("falls back to Unlabelled", () => {
    expect(cleanMerchantName("")).toBe("Unlabelled");
    expect(cleanMerchantName(null)).toBe("Unlabelled");
    expect(cleanMerchantName("(no description)")).toBe("Unlabelled");
    expect(cleanMerchantName("-12,345.00")).toBe("Unlabelled");
  });

  it("truncates long names with an ellipsis", () => {
    const long = "The Extremely Long Merchant Name That Never Ends Trading As Something";
    expect(cleanMerchantName(long, 20).endsWith("…")).toBe(true);
  });
});

describe("merchantKey", () => {
  it("merges variants of the same counterparty", () => {
    expect(merchantKey("FNB App Payment To Mama Coka")).toBe(merchantKey("mama coka-500.00"));
  });
});
