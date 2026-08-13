/*
 * Shared data-viz tokens for the analytics reports. One palette + chrome so every
 * chart reads as the same product (per the ui-ux-pro-max Charts & Data rules:
 * accessible colors, subtle gridlines, never color-alone).
 */

// Fixed categorical series palette (AA on white). Semantic: green = primary/
// positive, orange/red = drop-off/negative, gray = neutral.
export const CHART_COLORS = [
  '#16a34a', // green (brand / primary)
  '#60a5fa', // blue
  '#a78bfa', // purple
  '#2dd4bf', // teal
  '#fb923c', // orange
  '#f472b6', // pink
  '#9ca3af', // gray
];

export const POSITIVE = '#16a34a';
export const NEGATIVE = '#fb923c';
export const NEUTRAL = '#9ca3af';

export const GRID = '#e5e7eb';
export const AXIS_TICK = { fontSize: 12, fill: '#6b7280' } as const;
export const TOOLTIP_STYLE = { borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 } as const;

export function colorAt(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

/**
 * Percentage formatting is split by INPUT UNIT on purpose.
 *
 * The reports API is not uniform: `ratio()` fields (conversion_rate,
 * completion_rate, verification_rate…) come back as 0–1 fractions, while
 * `OperationsMath::pct()` fields (conversion_rates[].rate, funnel[].pct) come
 * back already scaled to 0–100. A single `pct()` that always multiplied by 100
 * silently rendered the already-scaled ones a hundred times too large — the
 * Daily Operations console showed "Account → KYC 9300.0%" for a 93% rate.
 *
 * Naming the unit at the call site makes that mistake visible in review, and
 * the clamp stops any future mismatch from reaching a user as a wild number.
 */
function formatPercent(value: number): string {
  if (!Number.isFinite(value)) return '—';

  return `${Math.min(100, Math.max(0, value)).toFixed(1)}%`;
}

/** For API fields expressed as a 0–1 fraction (e.g. `ratio()` output). */
export function pctFromFraction(v: number): string {
  return formatPercent(v * 100);
}

/** For API fields already expressed as a 0–100 percentage. */
export function pctFromPercent(v: number): string {
  return formatPercent(v);
}

export function compact(n: number): string {
  return Intl.NumberFormat(undefined, { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

export function hours(n: number): string {
  if (n >= 48) return `${(n / 24).toFixed(1)}d`;
  return `${Math.round(n)}h`;
}
