import type { Snippet } from 'svelte';
import type { ColumnAlign, Option } from './types.js';

/** A column filter: text is matched as a substring, a list as a set of accepted values. */
export type DataTableFilterValue = string | string[];

export interface DataTableColumn<T> {
  /** Unique within the table; the key for sorting, filtering and visibility. */
  id: string;
  /** Column heading, and the column's name in menus. */
  header: string;
  /** Where the value comes from. Defaults to `row[id]`. */
  accessor?: keyof T | ((row: T) => unknown);
  sortable?: boolean;
  /** Custom order for this column. Defaults to numbers, then dates, then natural text order. */
  compare?: (a: T, b: T) => number;
  align?: ColumnAlign;
  /** A CSS width for the column. */
  width?: string;
  /** Offered in the column-visibility menu. Defaults to `true`. */
  hideable?: boolean;
  /** Included in the global search. Defaults to `true`. */
  searchable?: boolean;
  /**
   * Hide the column at and below a breakpoint, so a narrow screen keeps the columns that matter.
   * The data stays searchable and sortable.
   */
  hideBelow?: 'compact' | 'expanded';
  /** Display text. Defaults to the value as text, with dates as local dates. */
  format?: (value: unknown, row: T) => string;
  /** Custom filter test. Defaults to a substring match for text and set membership for lists. */
  filter?: (row: T, value: DataTableFilterValue) => boolean;
  /** Choices for a faceted filter. Defaults to the distinct values present in the data. */
  filterOptions?: Option[];
  /** Custom cell content. Receives the row's data. */
  cell?: Snippet<[T]>;
  /** Allow editing the cell in place. `DataTable` reports edits through `onCellEdit`. */
  editable?: boolean;
}

/** The value a column reads from a row. */
export function cellValue<T>(row: T, column: DataTableColumn<T>): unknown {
  const { accessor, id } = column;
  if (typeof accessor === 'function') return accessor(row);
  return (row as Record<PropertyKey, unknown>)[(accessor ?? id) as PropertyKey];
}

/** The text a cell shows. */
export function formatCell<T>(row: T, column: DataTableColumn<T>): string {
  const value = cellValue(row, column);
  if (column.format) return column.format(value, row);
  if (value == null) return '';
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toLocaleDateString();
  if (Array.isArray(value)) return value.join(', ');
  return String(value);
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });

/**
 * Ascending order for two cell values: numbers numerically, dates by time, everything else in
 * natural text order ("Sheet 2" before "Sheet 10"). Empty values always sort last, whichever
 * the direction, so they never crowd the top of a list.
 */
export function compareValues(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return collator.compare(String(a), String(b));
}

const isEmpty = (value: unknown) =>
  value == null || value === '' || (value instanceof Date && Number.isNaN(value.getTime()));

/**
 * A comparator for one column. `direction` 1 is ascending, -1 descending; empty values stay at
 * the end either way.
 */
export function rowComparator<T>(column: DataTableColumn<T>, direction: 1 | -1) {
  return (a: T, b: T): number => {
    if (column.compare) return column.compare(a, b) * direction;
    const [left, right] = [cellValue(a, column), cellValue(b, column)];
    const [leftEmpty, rightEmpty] = [isEmpty(left), isEmpty(right)];
    if (leftEmpty || rightEmpty) return Number(leftEmpty) - Number(rightEmpty);
    return compareValues(left, right) * direction;
  };
}

/** Sorts a copy of `rows` by one column. */
export function sortRows<T>(
  rows: readonly T[],
  column: DataTableColumn<T>,
  direction: 1 | -1
): T[] {
  return [...rows].sort(rowComparator(column, direction));
}

/** Whether a filter is set to anything at all. */
export const isActiveFilter = (value: DataTableFilterValue | null | undefined) =>
  value != null && (Array.isArray(value) ? value.length > 0 : value.trim() !== '');

/** The default column filter: a case-insensitive substring for text, membership for a list. */
export function matchesFilter<T>(
  row: T,
  column: DataTableColumn<T>,
  value: DataTableFilterValue
): boolean {
  if (column.filter) return column.filter(row, value);
  const raw = cellValue(row, column);
  if (Array.isArray(value)) {
    const accepted = new Set(value);
    return Array.isArray(raw)
      ? raw.some((item) => accepted.has(String(item)))
      : accepted.has(String(raw ?? ''));
  }
  return formatCell(row, column).toLocaleLowerCase().includes(value.trim().toLocaleLowerCase());
}

/** Whether any searchable column's text contains `query`. */
export function matchesSearch<T>(
  row: T,
  columns: readonly DataTableColumn<T>[],
  query: string
): boolean {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return true;
  return columns.some(
    (column) =>
      column.searchable !== false && formatCell(row, column).toLocaleLowerCase().includes(needle)
  );
}

/** How many rows hold each distinct value of a column — the counts beside a faceted filter. */
export function countValues<T>(
  rows: readonly T[],
  column: DataTableColumn<T>
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const raw = cellValue(row, column);
    for (const item of Array.isArray(raw) ? raw : [raw]) {
      if (isEmpty(item)) continue;
      const key = String(item);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  return counts;
}
