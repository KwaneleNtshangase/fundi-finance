/**
 * Report insights engine - deterministic rules that turn the report model
 * into a verdict, a narrative and an action plan.
 *
 * Same design constraints as src/lib/coach/insights.ts (POPIA + FAIS):
 *   - Pure functions: every number is computed here in code. No AI, no
 *     network calls, no data leaves the user's session.
 *   - Educational only: insights teach principles and point to lessons.
 *     They NEVER name financial products or providers, and never say
 *     "you should buy/invest/switch" (FAIS "advice" boundary).
 */

import { formatZarCurrency } from "@/lib/currency";
import { formatPeriodLabel } from "./period";
import type {
  ExpenseCategoryRow,
  HealthComponent,
  InsightTone,
  ReportAction,
  ReportBenchmark,
  ReportHighlight,
  ReportInsights,
  ReportModel,
} from "./types";

type ReportCore = Omit<ReportModel, "insights">;

// Lesson links mirror the catalogue in src/lib/coach/insights.ts.
const LESSONS = {
  buildingBudget: { courseId: "money-basics", lessonId: "lesson-3", title: "Building a Budget" },
  trackingSpend: { courseId: "money-basics", lessonId: "lesson-4", title: "Tracking Your Spending" },
  needsVsWants: { courseId: "money-basics", lessonId: "lesson-2", title: "Needs vs Wants" },
  debtSnowball: { courseId: "credit-debt", lessonId: "lesson-5", title: "The Debt Snowball Method" },
  emergencyFund: { courseId: "emergency-fund", lessonId: "lesson-1", title: "How Much Do You Need?" },
} as const;

/** Guidelines quoted in the report (common budgeting rules of thumb). */
export const GUIDELINES = {
  savingsRatePct: 20, // "20% to savings & debt payoff" (50/30/20)
  debtShareOfIncomePct: 35,
  needsSharePct: 50,
  wantsSharePct: 30,
  unclassifiedWarnPct: 20,
} as const;

function rand(cents: number): string {
  return formatZarCurrency(Math.round(cents / 100), { decimals: 0 });
}

function pctOf(part: number, whole: number): number {
  return whole > 0 ? Math.round((part / whole) * 100) : 0;
}

/** Debt repayments = "goals" group rows that are NOT savings vehicles. */
function debtCents(core: ReportCore): number {
  return core.expenseCategories
    .filter((r) => r.group === "goals" && !r.isSavingsVehicle)
    .reduce((s, r) => s + r.actualCents, 0);
}

/**
 * Categories the user can't realistically cut by choice this month - bank fees,
 * insurance, rent, tithe, tax. Recommending "trim these by 10%" is useless.
 */
const NON_TRIMMABLE = /\b(bank\s*charge|fee|insurance|funeral|rent|bond|housing|tithe|tax|levy|levies|medical\s+aid)\b/i;

/**
 * Biggest category where a cut is actually possible: needs/wants that aren't
 * fixed obligations. Debt repayments and savings vehicles are commitments too.
 */
function topTrimmableRow(core: ReportCore): ExpenseCategoryRow | null {
  return (
    core.expenseCategories.find(
      (r) =>
        (r.group === "needs" || r.group === "wants") &&
        r.actualCents > 0 &&
        !NON_TRIMMABLE.test(`${r.categoryId} ${r.categoryName}`)
    ) ?? null
  );
}

/** Approximate months in the period, for "per month" phrasing. */
function monthsSpanned(core: ReportCore): number {
  const complete = core.monthlySpend.filter((m) => !m.isPartial).length;
  if (complete > 0) return complete;
  return Math.max(1, core.monthlySpend.length);
}

// ─── Health score ─────────────────────────────────────────────────────────────

function scoreCashFlow(core: ReportCore): HealthComponent {
  const max = 25;
  if (core.totalIncomeCents <= 0) {
    return { label: "Cash flow", score: 0, max, tone: "bad", note: "No income recorded this period" };
  }
  const ratio = core.netCents / core.totalIncomeCents;
  if (ratio >= 0.1)
    return { label: "Cash flow", score: 25, max, tone: "good", note: `Ended ${rand(core.netCents)} ahead` };
  if (ratio >= 0)
    return { label: "Cash flow", score: 16, max, tone: "good", note: `Slightly ahead (${rand(core.netCents)})` };
  if (ratio >= -0.1)
    return { label: "Cash flow", score: 6, max, tone: "warn", note: `Spent ${rand(-core.netCents)} more than earned` };
  return { label: "Cash flow", score: 0, max, tone: "bad", note: `Spent ${rand(-core.netCents)} more than earned` };
}

function scoreSavingsHabit(core: ReportCore): HealthComponent {
  const max = 25;
  const r = core.savingsRatePct;
  const note = `${r}% of income set aside (guideline: ${GUIDELINES.savingsRatePct}%)`;
  if (r >= 20) return { label: "Savings habit", score: 25, max, tone: "good", note };
  if (r >= 15) return { label: "Savings habit", score: 19, max, tone: "good", note };
  if (r >= 10) return { label: "Savings habit", score: 14, max, tone: "warn", note };
  if (r >= 5) return { label: "Savings habit", score: 8, max, tone: "warn", note };
  if (r > 0) return { label: "Savings habit", score: 4, max, tone: "bad", note };
  return { label: "Savings habit", score: 0, max, tone: "bad", note: "Nothing set aside this period" };
}

function scoreDebtLoad(core: ReportCore): HealthComponent {
  const max = 20;
  const debt = debtCents(core);
  if (debt <= 0) {
    // Be honest: with lots of unclassified spend, "no debt" may just mean
    // "no debt we can see".
    const dirty = core.dataQuality.unclassifiedExpenseSharePct >= GUIDELINES.unclassifiedWarnPct;
    return {
      label: "Debt load",
      score: dirty ? 14 : 20,
      max,
      tone: dirty ? "warn" : "good",
      note: dirty
        ? `No debt repayments visible - but ${core.dataQuality.unclassifiedExpenseSharePct}% of spending is unclassified`
        : "No debt repayments recorded",
    };
  }
  if (core.totalIncomeCents <= 0)
    return { label: "Debt load", score: 0, max, tone: "bad", note: "Debt repayments with no income recorded" };
  const share = debt / core.totalIncomeCents;
  const dirty = core.dataQuality.unclassifiedExpenseSharePct >= GUIDELINES.unclassifiedWarnPct;
  const note = `${Math.round(share * 100)}% of income to debt (guideline: below ${GUIDELINES.debtShareOfIncomePct}%)`;
  if (share <= 0.15) {
    // A clean-looking debt share can't earn near-full marks while a big slice of
    // spending is unclassified - undetected debt could be hiding in "Other". Cap
    // it at half and mark it unverified so the score matches the inline caveat.
    if (dirty) {
      return {
        label: "Debt load",
        score: 10,
        max,
        tone: "warn",
        note: `Unverified - ${core.dataQuality.unclassifiedExpenseSharePct}% of spending is unclassified, so hidden debt can't be ruled out`,
      };
    }
    return { label: "Debt load", score: 20, max, tone: "good", note };
  }
  if (share <= 0.35) return { label: "Debt load", score: 12, max, tone: "warn", note };
  if (share <= 0.5) return { label: "Debt load", score: 5, max, tone: "bad", note };
  return { label: "Debt load", score: 0, max, tone: "bad", note };
}

function scoreBudgetDiscipline(core: ReportCore): HealthComponent {
  const max = 15;
  if (core.dayToDayBudgetedCents <= 0) {
    return { label: "Budget coverage", score: 4, max, tone: "warn", note: "No day-to-day budgets set yet" };
  }
  const used = core.budgetUsedPct ?? 0;
  // Coverage matters as much as adherence: staying under budget on two small
  // categories while most spending runs unmanaged is not discipline.
  const covered = pctOf(core.budgetedActualCents, core.consumptionCents);
  const note = `${used}% of budget used, but budgets only cover ${covered}% of day-to-day spend`;
  const goodNote = `${used}% of budget used · budgets cover ${covered}% of day-to-day spend`;
  if (used <= 100 && covered >= 60)
    return { label: "Budget coverage", score: 15, max, tone: "good", note: goodNote };
  if (used <= 100 && covered >= 30)
    return { label: "Budget coverage", score: 9, max, tone: "warn", note };
  if (used <= 115) return { label: "Budget coverage", score: 7, max, tone: "warn", note };
  return { label: "Budget coverage", score: 3, max, tone: "bad", note };
}

function scoreDataQuality(core: ReportCore): HealthComponent {
  const max = 15;
  const share = core.dataQuality.unclassifiedExpenseSharePct;
  const note = `${share}% of spending is unclassified`;
  if (share <= 10) return { label: "Data quality", score: 15, max, tone: "good", note };
  if (share <= 25) return { label: "Data quality", score: 9, max, tone: "warn", note };
  if (share <= 40) return { label: "Data quality", score: 5, max, tone: "bad", note };
  return { label: "Data quality", score: 0, max, tone: "bad", note };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function computeReportInsights(core: ReportCore): ReportInsights {
  const income = core.totalIncomeCents;
  const debt = debtCents(core);
  const debtSharePct = pctOf(debt, income);
  const months = monthsSpanned(core);
  const avgMonthlyIncome = income / months;
  const unclassifiedPct = core.dataQuality.unclassifiedExpenseSharePct;
  const periodLabel = formatPeriodLabel(core.periodStart, core.periodEnd);

  const healthComponents = [
    scoreCashFlow(core),
    scoreSavingsHabit(core),
    scoreDebtLoad(core),
    scoreBudgetDiscipline(core),
    scoreDataQuality(core),
  ];
  const healthScoreRaw = healthComponents.reduce((s, c) => s + c.score, 0);

  // Data quality is a bottleneck, not just a 15-point slice: when a third of
  // spending is unclassified, the cash-flow and debt scores are built on data
  // we can't see, so the headline number must not read as reassuring.
  let healthCap = 100;
  if (unclassifiedPct >= 40) healthCap = 50;
  else if (unclassifiedPct >= 30) healthCap = 60;
  else if (unclassifiedPct >= GUIDELINES.unclassifiedWarnPct) healthCap = 75;
  const healthScore = Math.min(healthScoreRaw, healthCap);
  const healthCapNote =
    healthScore < healthScoreRaw
      ? `Capped at ${healthCap} (would be ${healthScoreRaw}): with ${unclassifiedPct}% of spending unclassified, the other scores can't be fully trusted.`
      : null;
  const healthBand =
    healthScore >= 80 ? "Strong" : healthScore >= 60 ? "Steady" : healthScore >= 40 ? "Fragile" : "Needs attention";

  // ── Highlights (cover page, max 4) ──────────────────────────────────────
  const highlights: ReportHighlight[] = [];
  if (income > 0 || core.totalExpenseCents > 0) {
    highlights.push(
      core.netCents >= 0
        ? { tone: "good", text: `You ended the period ${rand(core.netCents)} ahead.` }
        : { tone: "bad", text: `You spent ${rand(-core.netCents)} more than you earned.` }
    );
  }
  if (income > 0) {
    highlights.push(
      core.savingsRatePct >= GUIDELINES.savingsRatePct
        ? { tone: "good", text: `You set aside ${core.savingsRatePct}% of income - at or above the ${GUIDELINES.savingsRatePct}% guideline.` }
        : { tone: "warn", text: `You set aside ${core.savingsRatePct}% of income (${rand(core.setAsideCents)}); the common guideline is ${GUIDELINES.savingsRatePct}%.` }
    );
  }
  if (unclassifiedPct >= GUIDELINES.unclassifiedWarnPct) {
    highlights.push({
      tone: "warn",
      text: `${unclassifiedPct}% of spending (${rand(core.groupTotals.unclassified)}) is unclassified - the picture below is blurry until it's categorised.`,
    });
  }
  if (debtSharePct >= 30) {
    highlights.push({ tone: "bad", text: `Debt repayments took ${debtSharePct}% of your income (${rand(debt)}).` });
  }
  if (core.totalBudgetedExpenseCents > 0 && core.budgetVarianceCents > 0 && highlights.length < 4) {
    highlights.push({
      tone: "warn",
      text: `Budgeted categories ran ${rand(core.budgetVarianceCents)} over plan.`,
    });
  }
  if (core.topUnderBudget.length > 0 && highlights.length < 4) {
    const w = core.topUnderBudget[0];
    highlights.push({
      tone: "good",
      text: `${w.categoryName} came in ${rand(-w.varianceCents)} under budget - well controlled.`,
    });
  }

  // ── Wins & risks ────────────────────────────────────────────────────────
  const wins: string[] = [];
  const risks: string[] = [];

  for (const r of core.topUnderBudget.slice(0, 2)) {
    wins.push(`${r.categoryName}: ${rand(-r.varianceCents)} under budget (${r.variancePct}% used).`);
  }
  if (core.savingsRatePct >= GUIDELINES.savingsRatePct) {
    wins.push(`Set aside ${rand(core.setAsideCents)} - a ${core.savingsRatePct}% savings rate.`);
  }
  if (core.comparison?.setAsideDeltaPct != null && core.comparison.setAsideDeltaPct > 0) {
    wins.push(`Money set aside is up ${core.comparison.setAsideDeltaPct}% vs the previous period.`);
  }
  const positiveMonths = core.monthlySpend.filter((m) => !m.isPartial && m.netCents >= 0).length;
  const fullMonths = core.monthlySpend.filter((m) => !m.isPartial).length;
  if (fullMonths >= 2 && positiveMonths === fullMonths) {
    wins.push(`Every complete month in this period ended in the green (${fullMonths}/${fullMonths}).`);
  }
  if (core.incomeCategories.length >= 2 && core.incomeCategories[0].sharePct < 60) {
    wins.push(`Income is spread across ${core.incomeCategories.length} sources - no single point of failure.`);
  }
  const goalsSharePct = pctOf(core.groupTotals.goals, core.totalExpenseCents);
  if (goalsSharePct >= 40) {
    wins.push(
      `${rand(core.groupTotals.goals)} (${goalsSharePct}%) of this period's money went toward building future wealth - savings, stokvel and debt payoff.`
    );
  }

  for (const r of core.topOverBudget.slice(0, 2)) {
    risks.push(`${r.categoryName}: ${rand(r.varianceCents)} over budget (${r.variancePct}% used).`);
  }
  if (unclassifiedPct >= GUIDELINES.unclassifiedWarnPct) {
    risks.push(`${unclassifiedPct}% of spending is unclassified, hiding where money actually goes.`);
  }
  if (debtSharePct >= 30) {
    risks.push(`Debt repayments at ${debtSharePct}% of income leave little room for goals.`);
  }
  if (income > 0 && core.incomeCategories.length > 0 && core.incomeCategories[0].sharePct >= 80) {
    risks.push(`${core.incomeCategories[0].sharePct}% of income comes from one source (${core.incomeCategories[0].categoryName}).`);
  }
  const negativeMonths = core.monthlySpend.filter((m) => !m.isPartial && m.netCents < 0);
  if (negativeMonths.length > 0) {
    risks.push(
      `${negativeMonths.length} month${negativeMonths.length === 1 ? "" : "s"} ended in the red (${negativeMonths.map((m) => m.label).join(", ")}).`
    );
  }
  if (income > 0 && core.savingsRatePct < 5) {
    risks.push(`At a ${core.savingsRatePct}% set-aside rate, an emergency cushion isn't building.`);
  }
  const recurringDebt = core.recurringCommitments.filter(
    (r) => r.group === "goals" && /\b(loan|debt|repay)/i.test(`${r.description} ${r.categoryName}`)
  );
  if (recurringDebt.length > 0) {
    const d = recurringDebt[0];
    risks.push(
      `Recurring loan repayment detected: ${d.description} at ~${rand(d.typicalCents)}/month for ${d.monthsSeen} months running.`
    );
  }
  // Volatility: big swings vs the previous period are the most important
  // thing happening in a report and must never pass silently.
  if (core.comparison) {
    const swings: string[] = [];
    const inc = core.comparison.incomeDeltaPct;
    const exp = core.comparison.expenseDeltaPct;
    if (inc != null && Math.abs(inc) >= 40) swings.push(`income ${inc > 0 ? "up" : "down"} ${Math.abs(inc)}%`);
    if (exp != null && Math.abs(exp) >= 40) swings.push(`spending ${exp > 0 ? "up" : "down"} ${Math.abs(exp)}%`);
    if (swings.length > 0) {
      risks.push(
        `Big swing vs the previous period: ${swings.join(", ")}. If that isn't expected (bonus, once-off, seasonal), it's worth understanding before trusting the trend.`
      );
    }
  }
  // Data sanity: several complete months with IDENTICAL totals usually means
  // duplicated imports or templated entries, not real bank data.
  const totalsSeen = new Map<number, number>();
  for (const m of core.monthlySpend) {
    if (m.isPartial || m.expenseCents <= 0) continue;
    totalsSeen.set(m.expenseCents, (totalsSeen.get(m.expenseCents) ?? 0) + 1);
  }
  const identicalMonths = Math.max(0, ...totalsSeen.values());
  if (identicalMonths >= 3) {
    risks.push(
      `${identicalMonths} months show identical spending totals to the cent - worth checking for duplicate or templated imports.`
    );
  }

  // ── Actions (3-5, prioritised, each with estimated impact) ──────────────
  const actions: ReportAction[] = [];

  if (unclassifiedPct >= GUIDELINES.unclassifiedWarnPct) {
    actions.push({
      title: "Recategorise your 'Other' transactions",
      detail: `${rand(core.groupTotals.unclassified)} of spending has no real category. Sorting it takes minutes and is the single biggest accuracy win.`,
      impact: `Your next report explains ${unclassifiedPct}% more of your money`,
      lesson: LESSONS.trackingSpend,
    });
  }

  if (core.totalBudgetedExpenseCents <= 0) {
    actions.push({
      title: "Set your first category budgets",
      detail: "You're tracking spending but have no limits. A budget per category turns tracking into a plan.",
      lesson: LESSONS.buildingBudget,
    });
  } else if (pctOf(core.unbudgetedActualCents, core.totalExpenseCents) >= 30) {
    // "Other" is excluded: the fix for unclassified spend is recategorising,
    // not budgeting a junk-drawer category.
    const unbudgeted = core.expenseCategories
      .filter(
        (r) => !r.hasBudget && !r.isSavingsVehicle && r.group !== "unclassified" && r.actualCents > 0
      )
      .slice(0, 2)
      .map((r) => r.categoryName);
    if (unbudgeted.length > 0) {
      actions.push({
        title: `Set budgets for ${unbudgeted.join(" and ")}`,
        detail: `${rand(core.unbudgetedActualCents)} (${pctOf(core.unbudgetedActualCents, core.totalExpenseCents)}% of spending) sits in categories with no budget, so it never gets flagged.`,
        impact: "Overspend alerts start working for your biggest categories",
        lesson: LESSONS.buildingBudget,
      });
    }
  }

  if (income > 0 && core.savingsRatePct < GUIDELINES.savingsRatePct) {
    const targetRate = Math.min(core.savingsRatePct + 5, GUIDELINES.savingsRatePct);
    const extraPerMonth = Math.round((avgMonthlyIncome * (targetRate - core.savingsRatePct)) / 100);
    if (extraPerMonth > 0) {
      const surplusHint =
        core.netCents > extraPerMonth
          ? ` Your ${rand(core.netCents)} surplus already covers it - it just needs a job.`
          : "";
      actions.push({
        title: "Set aside a fixed amount on payday",
        detail: `Moving money to savings first - before spending - is the habit that makes the rate stick.${surplusHint}`,
        impact: `~ ${rand(extraPerMonth)}/month lifts your rate from ${core.savingsRatePct}% to ~${targetRate}% - about ${rand(extraPerMonth * 12)} extra set aside over 12 months`,
        lesson: LESSONS.emergencyFund,
      });
    }
  }

  if (debtSharePct >= 30) {
    actions.push({
      title: "Map out your debts and pick a payoff order",
      detail: `${rand(debt)} went to debt repayments this period. A structured method shrinks the total interest paid and the stress.`,
      lesson: LESSONS.debtSnowball,
    });
  }

  const trimRow = topTrimmableRow(core);
  if (actions.length < 5 && trimRow && income > 0) {
    const monthlyCut = Math.round((trimRow.actualCents / months) * 0.1);
    if (monthlyCut >= 10000) {
      const newRate = Math.round(((core.setAsideCents + monthlyCut * months) / income) * 100);
      actions.push({
        title: `Trim ${trimRow.categoryName} by 10%`,
        detail: `${trimRow.categoryName} is your biggest flexible spending category at ${rand(trimRow.actualCents)} (${trimRow.sharePct}% of spending). One change here beats ten small ones elsewhere.`,
        impact: `~ ${rand(monthlyCut)}/month freed - enough to reach a ~${newRate}% set-aside rate`,
        lesson: LESSONS.needsVsWants,
      });
    }
  }

  if (actions.length === 0) {
    actions.push({
      title: "Keep the streak going",
      detail: "Cash flow is positive, budgets are holding and your data is clean. Consistency is the whole game now.",
    });
  }
  // Actions are already in priority order; the first is THE one to do.
  actions[0].isTopPriority = true;

  // ── Coach narrative ─────────────────────────────────────────────────────
  const coachParagraphs: string[] = [];
  if (income > 0 || core.totalExpenseCents > 0) {
    const flow =
      core.netCents >= 0
        ? `leaving you ${rand(core.netCents)} ahead`
        : `leaving a ${rand(-core.netCents)} shortfall`;
    coachParagraphs.push(
      `Over ${periodLabel} you earned ${rand(income)}, spent ${rand(core.consumptionCents)} on day-to-day living and set aside ${rand(core.setAsideCents)} (${core.savingsRatePct}% of income) into savings vehicles like a stokvel or savings account - ${flow}.`
    );
  }
  const topSpendRow =
    core.expenseCategories.find((r) => !r.isSavingsVehicle && r.actualCents > 0) ?? null;
  if (topSpendRow) {
    const caveat =
      unclassifiedPct >= GUIDELINES.unclassifiedWarnPct
        ? ` Note: ${unclassifiedPct}% of spending is still unclassified, so the true picture may shift once it's categorised.`
        : "";
    coachParagraphs.push(
      `Your biggest day-to-day category was ${topSpendRow.categoryName} at ${rand(topSpendRow.actualCents)} (${topSpendRow.sharePct}% of all spending).${caveat}`
    );
  }
  if (core.projection.annualisedExpenseCents != null && core.projection.monthsUsed >= 2) {
    const wealthLine =
      income > 0 && core.savingsRatePct > 0 && core.savingsRatePct < GUIDELINES.savingsRatePct
        ? ` Kept at today's ${core.savingsRatePct}% rate, you'd set aside ~${rand(avgMonthlyIncome * (core.savingsRatePct / 100) * 12)} over the next 12 months; at ${GUIDELINES.savingsRatePct}% it would be ~${rand(avgMonthlyIncome * (GUIDELINES.savingsRatePct / 100) * 12)}.`
        : "";
    coachParagraphs.push(
      `At your average pace of ${rand(core.projection.avgMonthlyExpenseCents!)}/month (over ${core.projection.monthsUsed} complete months), you're on track to spend about ${rand(core.projection.annualisedExpenseCents)} this year.${wealthLine}`
    );
  }

  // ── Benchmarks ──────────────────────────────────────────────────────────
  // 50/30/20 is about PERSONAL spending, so business and unclassified are
  // excluded from the denominator - otherwise a big side-hustle month makes
  // "Needs 6%" look alarming when personal life is actually fine.
  const personalBase =
    core.groupTotals.needs + core.groupTotals.wants + core.groupTotals.goals;
  const needsPct = pctOf(core.groupTotals.needs, personalBase);
  const wantsPct = pctOf(core.groupTotals.wants, personalBase);
  const hasBusiness = core.groupTotals.business > 0;
  const shareLabel = hasBusiness ? "% of personal spending" : "% of spending";
  const toneFor = (ok: boolean, mid: boolean): InsightTone => (ok ? "good" : mid ? "warn" : "bad");
  const benchmarks: ReportBenchmark[] = [
    {
      label: "Set-aside (savings) rate",
      value: `${core.savingsRatePct}%`,
      target: `${GUIDELINES.savingsRatePct}%+ of income`,
      tone: toneFor(core.savingsRatePct >= 20, core.savingsRatePct >= 10),
    },
    {
      label: "Debt repayments",
      value: income > 0 ? `${debtSharePct}% of income` : "-",
      target: `below ${GUIDELINES.debtShareOfIncomePct}%`,
      tone: toneFor(debtSharePct < 20, debtSharePct <= GUIDELINES.debtShareOfIncomePct),
    },
    {
      label: "Needs (essentials)",
      value: `${needsPct}${shareLabel}`,
      target: `~${GUIDELINES.needsSharePct}% guideline`,
      tone: needsPct <= 65 ? "good" : "warn",
    },
    {
      label: "Wants (lifestyle)",
      value: `${wantsPct}${shareLabel}`,
      target: `~${GUIDELINES.wantsSharePct}% guideline`,
      tone: wantsPct <= GUIDELINES.wantsSharePct ? "good" : "warn",
    },
  ];
  if (core.budgetUsedPct != null) {
    benchmarks.push({
      label: "Budget used (like-for-like)",
      value: `${core.budgetUsedPct}%`,
      target: "100% or less",
      tone: toneFor(core.budgetUsedPct <= 100, core.budgetUsedPct <= 115),
    });
  }

  const dataQualityAlert =
    unclassifiedPct >= GUIDELINES.unclassifiedWarnPct
      ? `${unclassifiedPct}% of spending (${rand(core.groupTotals.unclassified)}) is sitting in "Other" or unknown categories. Until it's recategorised, every chart in this report understates where your money really goes.`
      : null;

  return {
    healthScore,
    healthScoreRaw,
    healthCapNote,
    healthBand,
    healthComponents,
    highlights: highlights.slice(0, 4),
    coachParagraphs,
    wins: wins.slice(0, 4),
    risks: risks.slice(0, 4),
    actions: actions.slice(0, 5),
    benchmarks,
    dataQualityAlert,
  };
}
