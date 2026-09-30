/*
 * Number and date formatting for axes, tooltips and descriptions. Every formatter takes a
 * `locale`: leaving it out uses the runtime default, which differs between the server and the
 * browser — pass one explicitly when a chart is server-rendered.
 */

export interface FormatOptions extends Intl.NumberFormatOptions {
  locale?: string | string[];
}

const cache = new Map<string, Intl.NumberFormat>();

function numberFormat({ locale, ...options }: FormatOptions = {}): Intl.NumberFormat {
  const key = JSON.stringify([locale ?? null, options]);
  let format = cache.get(key);
  if (!format) {
    format = new Intl.NumberFormat(locale, options);
    cache.set(key, format);
  }
  return format;
}

/** `1234.5` → `1,234.5`. Non-finite values format as an empty string. */
export function formatNumber(value: number | null | undefined, options?: FormatOptions): string {
  return value == null || !Number.isFinite(value) ? '' : numberFormat(options).format(value);
}

/** `12500` → `12.5K`, in the locale's own compact notation. */
export function formatCompact(value: number | null | undefined, options?: FormatOptions): string {
  return formatNumber(value, { notation: 'compact', maximumFractionDigits: 1, ...options });
}

/** `0.256` → `25.6%`. The value is a fraction, as `Intl` expects. */
export function formatPercent(value: number | null | undefined, options?: FormatOptions): string {
  return formatNumber(value, { style: 'percent', maximumFractionDigits: 1, ...options });
}

/** `1234` with `USD` → `$1,234.00`. */
export function formatCurrency(
  value: number | null | undefined,
  currency: string,
  options?: FormatOptions
): string {
  return formatNumber(value, { style: 'currency', currency, ...options });
}

/** A date or timestamp in the locale's medium date style. Invalid dates format as `''`. */
export function formatDate(
  value: Date | number | string,
  { locale, ...options }: Intl.DateTimeFormatOptions & { locale?: string | string[] } = {}
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const settings = Object.keys(options).length ? options : { dateStyle: 'medium' as const };
  return new Intl.DateTimeFormat(locale, settings).format(date);
}
