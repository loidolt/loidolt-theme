import { formatNumber, type FormatOptions } from './format.js';
import type { CategoryData, SliceDatum } from './types.js';

/*
 * Plain-language summaries for a chart's accessible description. They say what a sighted
 * reader takes in at a glance — the trend, the extremes, the biggest share — and leave the
 * detail to the data table. Pass your own `description` to a chart to replace them.
 */

const finite = (values: Array<number | null>) =>
  values.filter((value): value is number => value != null && Number.isFinite(value));

/** `rises`, `falls` or `holds steady`, comparing the first and last values. */
export function describeTrend(values: Array<number | null>): string {
  const present = finite(values);
  if (present.length < 2) return 'holds steady';
  const [first, last] = [present[0], present[present.length - 1]];
  const scale = Math.max(Math.abs(first), Math.abs(last), 1e-9);
  if (Math.abs(last - first) / scale < 0.02) return 'holds steady';
  return last > first ? 'rises' : 'falls';
}

/** The highest and lowest value and where each falls. */
export function extremes(
  values: Array<number | null>,
  labels: string[]
): { high: { label: string; value: number }; low: { label: string; value: number } } | null {
  let high: { label: string; value: number } | null = null;
  let low: { label: string; value: number } | null = null;
  values.forEach((value, index) => {
    if (value == null || !Number.isFinite(value)) return;
    const label = labels[index] ?? String(index + 1);
    if (!high || value > high.value) high = { label, value };
    if (!low || value < low.value) low = { label, value };
  });
  return high && low ? { high, low } : null;
}

const list = (items: string[]) =>
  items.length <= 1
    ? (items[0] ?? '')
    : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;

/** "3 series over 12 categories. Revenue rises, peaking at 40 in Dec; …" */
export function describeCategories(
  data: CategoryData,
  { kind = 'chart', format }: { kind?: string; format?: FormatOptions } = {}
): string {
  const { categories, series } = data;
  if (!series.length || !categories.length) return `Empty ${kind}.`;
  const parts = series.slice(0, 4).map((one) => {
    const range = extremes(one.data, categories);
    if (!range) return `${one.name} has no values`;
    const high = `${formatNumber(range.high.value, format)} in ${range.high.label}`;
    const low = `${formatNumber(range.low.value, format)} in ${range.low.label}`;
    return `${one.name} ${describeTrend(one.data)}, from a low of ${low} to a high of ${high}`;
  });
  const more = series.length > 4 ? ` ${series.length - 4} more series in the data table.` : '';
  const span = `${categories[0]} to ${categories[categories.length - 1]}`;
  const count = `${series.length} series`;
  return `${kind[0].toUpperCase()}${kind.slice(1)} of ${count} over ${categories.length} categories, ${span}. ${parts.join('; ')}.${more}`;
}

/** "Pie of 5 slices totalling 120. Largest: A 40 (33%), B 30 (25%) and C 20 (17%)." */
export function describeSlices(
  data: SliceDatum[],
  { kind = 'chart', format }: { kind?: string; format?: FormatOptions } = {}
): string {
  if (!data.length) return `Empty ${kind}.`;
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const top = [...data]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((slice) => {
      const share = total ? Math.round((slice.value / total) * 100) : 0;
      return `${slice.name} ${formatNumber(slice.value, format)} (${share}%)`;
    });
  return `${kind[0].toUpperCase()}${kind.slice(1)} of ${data.length} ${data.length === 1 ? 'part' : 'parts'} totalling ${formatNumber(total, format)}. Largest: ${list(top)}.`;
}

export { list as joinList };
