import {
  daysInCalendarMonth,
  enumerateMonths,
  firstDayOfMonthYear,
  inclusiveDayCount,
  lastDayOfMonthYear,
  maxDate,
  minDate,
} from "./period";
import { resolveCategoryMeta } from "./categories";
import type {
  BudgetEntryInput,
  BudgetTargetInput,
  CategoryMeta,
  ExpenseCategoryRow,
  IncomeCategoryRow,
  LargestTxn,
  MerchantInsight,
  MonthlySpend,
  ReportModel,
} from "./types";

const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function amountToCents(amount: number): number {
  return Math.round(amount * 100);
}

function inPeriod(entryDate: string, periodStart: string, periodEnd: string): boolean {
  return entryDate >= periodStart && entryDate <= periodEnd;
}

function monthOverlapSlice(
  monthYear: string,
  periodStart: string,
  periodEnd: string
): { overlapStart: string; overlapEnd: string } | null {
  const monthStart = firstDayOfMonthYear(monthYear);
  const monthEnd = lastDayOfMonthYear(monthYear);
  const overlapStart = maxDate(periodStart, monthStart);
  const overlapEnd = minDate(periodEnd, monthEnd);
  if (overlapEnd < overlapStart) return null;
  return { overlapStart, overlapEnd };
}

export function buildReport(
  entries: BudgetEntryInput[],
  targets: BudgetTargetInput[],
  categories: CategoryMeta[],
  periodStart: string,
  periodEnd: string,
  displayName: string,
  generatedAt: string = new Date().toISOString()
): ReportModel {
  const incomeByCategory: Record<string, number> = {};
  const expenseByCategory: Record<string, number> = {};
  let totalIncomeCents = 0;
  let totalExpenseCents = 0;

  const periodEntries = entries.filter(
    (e) => inPeriod(e.entry_date, periodStart, periodEnd) && !e.is_transfer
  );

  for (const entry of periodEntries) {
    const cents = amountToCents(entry.amount);
    if (entry.type === "income") {
      totalIncomeCents += cents;
      incomeByCategory[entry.category] = (incomeByCategory[entry.category] ?? 0) + cents;
    } else {
      totalExpenseCents += cents;
      expenseByCategory[entry.category] = (expenseByCategory[entry.category] ?? 0) + cents;
    }
  }

  const savingsCents = expenseByCategory["savings"] ?? 0;
  const savingsRatePct =
    totalIncomeCents > 0 ? Math.round((savingsCents / totalIncomeCents) * 100) : 0;
  const netCents = totalIncomeCents - totalExpenseCents;

  const monthsInPeriod = enumerateMonths(periodStart, periodEnd);
  const expenseCategoryIds = new Set<string>([
    ...Object.keys(expenseByCategory),
    ...targets.map((t) => t.category),
  ]);

  let budgetIsEstimate = false;
  const budgetedByCategory: Record<string, number> = {};

  for (const categoryId of expenseCategoryIds) {
    let categoryBudgetCents = 0;
    for (const monthYear of monthsInPeriod) {
      const target = targets.find((t) => t.category === categoryId && t.month_year === monthYear);
      if (!target || target.monthly_limit <= 0) continue;

      const slice = monthOverlapSlice(monthYear, periodStart, periodEnd);
      if (!slice) continue;

      const [y, m] = monthYear.split("-").map(Number);
      const daysInMonth = daysInCalendarMonth(y, m);
      const daysInOverlap = inclusiveDayCount(slice.overlapStart, slice.overlapEnd);
      const monthBudgetCents = Math.round(target.monthly_limit * 100);

      if (daysInOverlap === daysInMonth) {
        categoryBudgetCents += monthBudgetCents;
      } else {
        categoryBudgetCents += Math.round((monthBudgetCents * daysInOverlap) / daysInMonth);
        budgetIsEstimate = true;
      }
    }
    if (categoryBudgetCents > 0) {
      budgetedByCategory[categoryId] = categoryBudgetCents;
    }
  }

  const totalBudgetedExpenseCents = Object.values(budgetedByCategory).reduce((s, v) => s + v, 0);
  const budgetVarianceCents = totalExpenseCents - totalBudgetedExpenseCents;
  const budgetUsedPct =
    totalBudgetedExpenseCents > 0
      ? Math.round((totalExpenseCents / totalBudgetedExpenseCents) * 100)
      : null;

  const expenseCategories: ExpenseCategoryRow[] = [];
  const allExpenseIds = new Set([
    ...Object.keys(expenseByCategory),
    ...Object.keys(budgetedByCategory),
  ]);

  for (const categoryId of allExpenseIds) {
    const actualCents = expenseByCategory[categoryId] ?? 0;
    const budgetedCents = budgetedByCategory[categoryId] ?? 0;
    if (actualCents === 0 && budgetedCents === 0) continue;

    const meta = resolveCategoryMeta(categoryId, categories);
    const varianceCents = actualCents - budgetedCents;
    const variancePct = budgetedCents > 0 ? Math.round((actualCents / budgetedCents) * 100) : null;
    const sharePct =
      totalExpenseCents > 0 ? Math.round((actualCents / totalExpenseCents) * 1000) / 10 : 0;

    expenseCategories.push({
      categoryId,
      categoryName: meta.name,
      color: meta.color,
      budgetedCents,
      actualCents,
      varianceCents,
      variancePct,
      sharePct,
      overBudget: actualCents > budgetedCents && budgetedCents > 0,
    });
  }
  expenseCategories.sort((a, b) => b.actualCents - a.actualCents);

  const incomeCategories: IncomeCategoryRow[] = Object.entries(incomeByCategory)
    .map(([categoryId, actualCents]) => {
      const meta = resolveCategoryMeta(categoryId, categories);
      const sharePct =
        totalIncomeCents > 0 ? Math.round((actualCents / totalIncomeCents) * 1000) / 10 : 0;
      return { categoryId, categoryName: meta.name, actualCents, sharePct };
    })
    .sort((a, b) => b.actualCents - a.actualCents);

  const monthlySpend: MonthlySpend[] = monthsInPeriod.map((monthYear) => {
    const slice = monthOverlapSlice(monthYear, periodStart, periodEnd)!;
    let expenseCents = 0;
    let incomeCents = 0;
    for (const entry of periodEntries) {
      if (entry.entry_date < slice.overlapStart || entry.entry_date > slice.overlapEnd) continue;
      if (entry.type === "expense") expenseCents += amountToCents(entry.amount);
      else incomeCents += amountToCents(entry.amount);
    }
    const [, m] = monthYear.split("-").map(Number);
    return { monthYear, label: MONTH_SHORT[m - 1], expenseCents, incomeCents };
  });

  const merchantMap = new Map<string, number>();
  for (const entry of periodEntries) {
    if (entry.type !== "expense") continue;
    const key = (entry.description ?? "").trim().toLowerCase() || "(no description)";
    merchantMap.set(key, (merchantMap.get(key) ?? 0) + amountToCents(entry.amount));
  }
  const topMerchants: MerchantInsight[] = [...merchantMap.entries()]
    .map(([description, totalCents]) => ({ description, totalCents }))
    .sort((a, b) => b.totalCents - a.totalCents)
    .slice(0, 5);

  const largestTransactions: LargestTxn[] = periodEntries
    .filter((e) => e.type === "expense")
    .map((e) => {
      const meta = resolveCategoryMeta(e.category, categories);
      return {
        id: e.id,
        description: e.description?.trim() || "(no description)",
        category: e.category,
        categoryName: meta.name,
        cents: amountToCents(e.amount),
        date: e.entry_date,
      };
    })
    .sort((a, b) => b.cents - a.cents)
    .slice(0, 5);

  const withBudget = expenseCategories.filter((r) => r.budgetedCents > 0);
  const topOverBudget = [...withBudget]
    .sort((a, b) => b.varianceCents - a.varianceCents)
    .filter((r) => r.varianceCents > 0)
    .slice(0, 3);
  const topUnderBudget = [...withBudget]
    .sort((a, b) => a.varianceCents - b.varianceCents)
    .filter((r) => r.varianceCents < 0)
    .slice(0, 3);

  return {
    periodStart,
    periodEnd,
    displayName,
    generatedAt,
    totalIncomeCents,
    totalExpenseCents,
    netCents,
    savingsRatePct,
    totalBudgetedExpenseCents,
    budgetVarianceCents,
    budgetUsedPct,
    budgetIsEstimate,
    expenseCategories,
    incomeCategories,
    monthlySpend,
    topMerchants,
    largestTransactions,
    topOverBudget,
    topUnderBudget,
  };
}

export function assertReportModel(model: ReportModel): void {
  const sumExpenseCats = model.expenseCategories.reduce((s, r) => s + r.actualCents, 0);
  const sumIncomeCats = model.incomeCategories.reduce((s, r) => s + r.actualCents, 0);
  const sumBudgeted = model.expenseCategories.reduce((s, r) => s + r.budgetedCents, 0);

  if (sumExpenseCats !== model.totalExpenseCents) {
    throw new Error(
      `Expense category sum mismatch: ${sumExpenseCats} !== ${model.totalExpenseCents}`
    );
  }
  if (sumIncomeCats !== model.totalIncomeCents) {
    throw new Error(`Income category sum mismatch: ${sumIncomeCats} !== ${model.totalIncomeCents}`);
  }
  if (sumBudgeted !== model.totalBudgetedExpenseCents) {
    throw new Error(
      `Budgeted category sum mismatch: ${sumBudgeted} !== ${model.totalBudgetedExpenseCents}`
    );
  }
}

export function sumDbEntriesCents(
  entries: BudgetEntryInput[],
  periodStart: string,
  periodEnd: string
): { incomeCents: number; expenseCents: number } {
  let incomeCents = 0;
  let expenseCents = 0;
  for (const e of entries) {
    if (!inPeriod(e.entry_date, periodStart, periodEnd) || e.is_transfer) continue;
    const cents = amountToCents(e.amount);
    if (e.type === "income") incomeCents += cents;
    else expenseCents += cents;
  }
  return { incomeCents, expenseCents };
}
