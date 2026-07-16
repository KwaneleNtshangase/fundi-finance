/**
 * Fundi Coach - anonymised month summary for the AI tier.
 *
 * This is the ONLY data that ever leaves the app for the AI provider.
 * By construction it contains category ids/labels and numbers ONLY:
 *   • no names, emails, usernames, or user ids
 *   • no transaction descriptions or merchant names
 *   • no account numbers, bank names, or dates of individual transactions
 *
 * All figures are pre-computed here in code - the model is instructed to
 * quote them, never to calculate. Deterministic output for testability.
 */

import {
  computeCoachInsights,
  formatRand,
  type CoachInput,
} from "./insights";

export type CoachSummary = {
  /** Plain-text block handed to the model as grounding context. */
  text: string;
  /** True when there is any data worth chatting about. */
  hasData: boolean;
};

function pct(n: number, of: number): string {
  if (of <= 0) return "n/a";
  return `${Math.round((n / of) * 100)}%`;
}

export function buildCoachSummary(input: CoachInput): CoachSummary {
  const label = (c: string) => input.categoryLabels[c] ?? c;

  const cur: Record<string, number> = {};
  const prev: Record<string, number> = {};
  let income = 0;
  let prevIncome = 0;

  for (const e of input.entries) {
    if (e.is_transfer) continue;
    const m = e.entry_date.slice(0, 7);
    const amt = Math.abs(Number(e.amount) || 0);
    if (m === input.monthKey) {
      if (e.type === "income") income += amt;
      else cur[e.category] = (cur[e.category] ?? 0) + amt;
    } else if (m === input.prevMonthKey) {
      if (e.type === "income") prevIncome += amt;
      else prev[e.category] = (prev[e.category] ?? 0) + amt;
    }
  }

  const totalSpend = Object.values(cur).reduce((a, b) => a + b, 0);
  const prevTotal = Object.values(prev).reduce((a, b) => a + b, 0);
  const cats = Object.keys({ ...cur, ...input.budgets }).sort(
    (a, b) => (cur[b] ?? 0) - (cur[a] ?? 0)
  );

  if (totalSpend === 0 && income === 0) {
    // Nothing this month - but last month's data is still worth talking about.
    if (prevTotal === 0 && prevIncome === 0) {
      return {
        hasData: false,
        text: "No budget data recorded for this month or last month yet.",
      };
    }
    const lines: string[] = [];
    lines.push(`Month: ${input.monthKey} (day ${input.dayOfMonth} of ${input.daysInMonth})`);
    lines.push(`No entries recorded for ${input.monthKey} yet.`);
    lines.push(`Last month (${input.prevMonthKey}): income ${formatRand(prevIncome)}, total spend ${formatRand(prevTotal)}.`);
    lines.push("Last month's spending by category:");
    for (const [cat, amt] of Object.entries(prev).sort((a, b) => b[1] - a[1])) {
      lines.push(`- ${label(cat)}: ${formatRand(amt)}`);
    }
    return { hasData: true, text: lines.join("\n") };
  }

  const lines: string[] = [];
  lines.push(`Month: ${input.monthKey} (day ${input.dayOfMonth} of ${input.daysInMonth})`);
  lines.push(`Income this month: ${formatRand(income)}${prevIncome > 0 ? ` (last month ${formatRand(prevIncome)})` : ""}`);
  lines.push(`Total spend this month: ${formatRand(totalSpend)}`);
  const saved = (cur["savings"] ?? 0) + (cur["Investments"] ?? 0);
  if (income > 0) lines.push(`Savings rate: ${pct(saved, income)} of income (${formatRand(saved)})`);
  lines.push("");
  lines.push("Spending by category (this month | budget | % of budget | last month):");

  for (const cat of cats) {
    const spent = cur[cat] ?? 0;
    const budget = input.budgets[cat] ?? 0;
    const last = prev[cat] ?? 0;
    lines.push(
      `- ${label(cat)}: ${formatRand(spent)} | ${budget > 0 ? formatRand(budget) : "no budget"} | ${budget > 0 ? pct(spent, budget) : "n/a"} | ${formatRand(last)}`
    );
  }

  // Ground the model with the rules engine's own findings so chat answers
  // stay consistent with the nudges shown on the card.
  const insights = computeCoachInsights(input);
  if (insights.length) {
    lines.push("");
    lines.push("Current coach findings:");
    for (const i of insights.slice(0, 5)) {
      lines.push(`- [${i.severity}] ${i.title}: ${i.body}${i.lesson ? ` (related lesson: "${i.lesson.title}")` : ""}`);
    }
  }

  return { hasData: true, text: lines.join("\n") };
}
