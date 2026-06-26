/** Cents-based report model — all monetary fields are integer cents. */

export type BudgetEntryInput = {
  id?: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description?: string | null;
  entry_date: string;
  is_transfer?: boolean;
  account_label?: string | null;
};

export type BudgetTargetInput = {
  category: string;
  monthly_limit: number;
  month_year: string;
};

export type CategoryMeta = {
  id: string;
  name: string;
  color: string;
  type: "expense" | "income";
};

export type ExpenseCategoryRow = {
  categoryId: string;
  categoryName: string;
  color: string;
  budgetedCents: number;
  actualCents: number;
  varianceCents: number;
  variancePct: number | null;
  sharePct: number;
  overBudget: boolean;
};

export type IncomeCategoryRow = {
  categoryId: string;
  categoryName: string;
  actualCents: number;
  sharePct: number;
};

export type MerchantInsight = {
  description: string;
  totalCents: number;
};

export type LargestTxn = {
  id?: string;
  description: string;
  category: string;
  categoryName: string;
  cents: number;
  date: string;
};

export type MonthlySpend = {
  monthYear: string;
  label: string;
  expenseCents: number;
  incomeCents: number;
};

export type ReportModel = {
  periodStart: string;
  periodEnd: string;
  displayName: string;
  generatedAt: string;
  totalIncomeCents: number;
  totalExpenseCents: number;
  netCents: number;
  savingsRatePct: number;
  totalBudgetedExpenseCents: number;
  budgetVarianceCents: number;
  budgetUsedPct: number | null;
  budgetIsEstimate: boolean;
  expenseCategories: ExpenseCategoryRow[];
  incomeCategories: IncomeCategoryRow[];
  monthlySpend: MonthlySpend[];
  topMerchants: MerchantInsight[];
  largestTransactions: LargestTxn[];
  topOverBudget: ExpenseCategoryRow[];
  topUnderBudget: ExpenseCategoryRow[];
};
