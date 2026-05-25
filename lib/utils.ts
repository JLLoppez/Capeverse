export function currency(value: number | string) {
  const amount = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    maximumFractionDigits: 0
  }).format(amount);
}

/**
 * Approximate exchange rates (build-time snapshot — for display guidance only).
 * Update periodically or wire up a real-time rate API if needed.
 */
const APPROX_RATES: Record<string, number> = {
  EUR: 0.050,
  GBP: 0.043,
  USD: 0.054,
};

/** Returns a human-readable "approx €X" hint string alongside the ZAR price */
export function currencyWithHint(zarValue: number | string, locale?: string | null): string {
  const zar = typeof zarValue === 'string' ? Number(zarValue) : zarValue;
  const zarFormatted = currency(zar);

  const targetCurrency = locale
    ? locale.startsWith('de') || locale.startsWith('fr') || locale.startsWith('nl')
      ? 'EUR'
      : locale.startsWith('en-GB')
      ? 'GBP'
      : null
    : null;

  if (!targetCurrency || !APPROX_RATES[targetCurrency]) return zarFormatted;

  const converted = Math.round(zar * APPROX_RATES[targetCurrency]);
  const symbol = targetCurrency === 'EUR' ? '€' : targetCurrency === 'GBP' ? '£' : '$';
  return `${zarFormatted} (≈ ${symbol}${converted.toLocaleString()})`;
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export function safeJsonParse<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
