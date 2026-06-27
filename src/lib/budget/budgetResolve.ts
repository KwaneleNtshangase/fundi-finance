/**
 * Budget resolution: a category's planned limit for a given month.
 *
 * Storage in `budget_targets.month_year`:
 *   - "YYYY-MM"          → a month-specific OVERRIDE (highest priority)
 *   - "default:YYYY-MM"  → a DEFAULT version effective FROM that month
 *   - "default"          → legacy baseline default (treated as effective forever)
 *
 * Resolution for (category, month M):
 *   1. exact month override for M, else
 *   2. the default version with the greatest effective-from <= M, else
 *   3. (for months before any default existed) the earliest default version, else
 *   4. 0 (no budget)
 *
 * This makes "set a default once, applies every month" work, while editing the
 * default only affects the month it's effective from and later — earlier months
 * keep whatever default was in force at the time.
 */

export type BudgetTargetRow = {
  category: string;
  monthly_limit: number;
  month_year: string;
};

export const LEGACY_DEFAULT_EFF = "0000-00";

/** Effective-from month for a default row, or null if the row isn't a default. */
export function defaultEffectiveFrom(monthYear: string): string | null {
  if (monthYear === "default") return LEGACY_DEFAULT_EFF;
  if (monthYear.startsWith("default:")) return monthYear.slice("default:".length);
  return null;
}

export function isDefaultRow(monthYear: string): boolean {
  return defaultEffectiveFrom(monthYear) !== null;
}

/** The default limit in force for `monthYear` (ignores month overrides). */
export function resolveDefaultBudget(
  targets: BudgetTargetRow[],
  category: string,
  monthYear: string
): number {
  const defaults = targets
    .filter((t) => t.category === category && isDefaultRow(t.month_year))
    .map((t) => ({ eff: defaultEffectiveFrom(t.month_year)!, limit: Number(t.monthly_limit) }))
    .sort((a, b) => a.eff.localeCompare(b.eff));
  if (defaults.length === 0) return 0;
  const applicable = defaults.filter((d) => d.eff <= monthYear);
  if (applicable.length) return applicable[applicable.length - 1].limit;
  return defaults[0].limit; // month precedes first default → use earliest
}

/** The effective planned limit for (category, monthYear): override wins, else default. */
export function resolveMonthlyBudget(
  targets: BudgetTargetRow[],
  category: string,
  monthYear: string
): number {
  const override = targets.find((t) => t.category === category && t.month_year === monthYear);
  if (override) return Number(override.monthly_limit);
  return resolveDefaultBudget(targets, category, monthYear);
}

/** All category ids that have any budget (override or default). */
export function budgetedCategoryIds(targets: BudgetTargetRow[]): Set<string> {
  return new Set(targets.map((t) => t.category));
}
