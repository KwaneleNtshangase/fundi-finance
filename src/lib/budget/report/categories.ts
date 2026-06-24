import type { CategoryMeta } from "./types";

export const STATIC_EXPENSE_CATEGORIES: Record<string, { name: string; color: string }> = {
  food: { name: "Food & Groceries", color: "#007A4D" },
  transport: { name: "Transport", color: "#FFB612" },
  housing: { name: "Housing/Rent", color: "#3B7DD8" },
  debt: { name: "Debt Repayments", color: "#E03C31" },
  savings: { name: "Savings", color: "#00BFA5" },
  entertainment: { name: "Entertainment", color: "#7C4DFF" },
  airtime: { name: "Airtime & Data", color: "#F57C00" },
  healthcare: { name: "Healthcare", color: "#C2185B" },
  education: { name: "Education", color: "#1976D2" },
  other: { name: "Other", color: "#9E9E9E" },
};

export const STATIC_INCOME_CATEGORIES: Record<string, { name: string }> = {
  salary: { name: "Salary / Wages" },
  freelance: { name: "Freelance" },
  business: { name: "Business Income" },
  "other-income": { name: "Other Income" },
};

export function resolveCategoryMeta(
  categoryId: string,
  customCategories: CategoryMeta[]
): { name: string; color: string; type: "expense" | "income" } {
  const custom = customCategories.find((c) => c.id === categoryId);
  if (custom) {
    return { name: custom.name, color: custom.color, type: custom.type };
  }
  const exp = STATIC_EXPENSE_CATEGORIES[categoryId];
  if (exp) return { name: exp.name, color: exp.color, type: "expense" };
  const inc = STATIC_INCOME_CATEGORIES[categoryId];
  if (inc) return { name: inc.name, color: "#007A4D", type: "income" };
  return { name: categoryId, color: "#9E9E9E", type: "expense" };
}
