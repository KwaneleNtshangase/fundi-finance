/**
 * Shared number / currency formatters used across components.
 * Kept in src/lib so they can be imported by both components and server utils.
 */

/** Thousands separated by non-breaking spaces (SA convention: 1 000 not 1,000) */
export function formatWithSpaces(value: number): string {
  if (!isFinite(value) || isNaN(value)) return "0";
  return Math.round(Math.abs(value))
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

/** Rand with space grouping: R1 234 */
export function formatRand(v: number): string {
  if (!isFinite(v) || isNaN(v)) return "R0";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  const formatted = Math.round(abs)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${sign}R${formatted}`;
}

/** Alias kept for backward compat inside CalculatorView */
export const formatZAR = formatRand;
