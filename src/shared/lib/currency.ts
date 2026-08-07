/** Full "LKR 1,234,567" formatting for tables, forms, and detail views. */
export function formatCurrency(amount: number): string {
  return `LKR ${amount.toLocaleString('en-LK', { maximumFractionDigits: 0 })}`
}

/** Abbreviated "LKR 6.5M" / "LKR 820K" formatting for KPI tiles and chart axes. */
export function formatCurrencyCompact(amount: number): string {
  const abs = Math.abs(amount)
  const sign = amount < 0 ? '-' : ''
  if (abs >= 1_000_000) return `${sign}LKR ${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}M`
  if (abs >= 1_000) return `${sign}LKR ${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}K`
  return formatCurrency(amount)
}

export function formatPercent(value: number, fractionDigits = 0): string {
  return `${value.toFixed(fractionDigits)}%`
}
