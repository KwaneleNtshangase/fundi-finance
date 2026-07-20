import { describe, expect, it } from "vitest";
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { buildReport } from "../aggregate";
import { BudgetReportDocument } from "../pdf";
import type { BudgetEntryInput, BudgetTargetInput } from "../types";

/**
 * Render smoke test: the report PDF must actually render from a rich,
 * multi-month model - guarding every model-shape change (new fields, new
 * insight branches) against a runtime crash inside @react-pdf.
 */

const FIXED_AT = "2026-06-30T10:00:00.000Z";

function richModel() {
  const entries: BudgetEntryInput[] = [];
  for (const m of ["2026-04", "2026-05", "2026-06"]) {
    entries.push({ type: "income", category: "salary", amount: 18000, entry_date: `${m}-25` });
    entries.push({ type: "income", category: "business", amount: 4000, entry_date: `${m}-15` });
    entries.push({ type: "expense", category: "housing", amount: 6000, entry_date: `${m}-01`, description: "Rent" });
    entries.push({ type: "expense", category: "food", amount: 3500, entry_date: `${m}-05`, description: "Checkers" });
    entries.push({ type: "expense", category: "transport", amount: 1800, entry_date: `${m}-08`, description: "Taxi fare" });
    entries.push({ type: "expense", category: "entertainment", amount: 450, entry_date: `${m}-03`, description: "DSTV Subscription" });
    entries.push({ type: "expense", category: "entertainment", amount: 199, entry_date: `${m}-04`, description: "Netflix" });
    entries.push({ type: "expense", category: "savings", amount: 3000, entry_date: `${m}-26`, description: "Stokvel contribution" });
    entries.push({ type: "expense", category: "debt", amount: 1200, entry_date: `${m}-02`, description: "Loan repayment" });
    entries.push({ type: "expense", category: "other", amount: 600, entry_date: `${m}-12` });
  }
  const targets: BudgetTargetInput[] = [
    { category: "food", monthly_limit: 4000, month_year: "2026-06" },
    { category: "transport", monthly_limit: 2000, month_year: "2026-06" },
  ];
  return buildReport(entries, targets, [], "2026-04-01", "2026-06-30", "Kwanele", FIXED_AT, {
    historyEntries: entries,
    historyStart: "2026-04-01",
  });
}

describe("BudgetReportDocument", () => {
  it("renders a valid multi-page PDF from a rich model", async () => {
    const model = richModel();
    // Sanity: the fixture exercises the new surfaces too.
    expect(model.behaviour.monthsAnalysed).toBe(3);
    expect(model.insights.actions.every((a) => a.id.length > 0)).toBe(true);

    const buffer = await renderToBuffer(
      React.createElement(BudgetReportDocument, { model }) as React.ReactElement<DocumentProps>
    );
    expect(buffer.length).toBeGreaterThan(10000);
    expect(Buffer.from(buffer.subarray(0, 5)).toString()).toBe("%PDF-");
  }, 30_000);
});
