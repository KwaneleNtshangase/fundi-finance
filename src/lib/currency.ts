export function formatNumberWithSpaces(value: number, decimals = 0): string {
  if (!Number.isFinite(value)) return "0";
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  const fixed = abs.toFixed(Math.max(0, decimals));
  const [whole, frac] = fixed.split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return frac ? `${sign}${grouped}.${frac}` : `${sign}${grouped}`;
}

export function formatZarCurrency(value: number, options?: { decimals?: number }): string {
  const decimals = options?.decimals ?? 2;
  return `R${formatNumberWithSpaces(value, decimals)}`;
}
