import { SvelteSet } from 'svelte/reactivity';
import {
  countValues,
  formatCell,
  isActiveFilter,
  matchesFilter,
  matchesSearch,
  rowComparator,
  type DataTableColumn,
  type DataTableFilterValue,
} from './data-table-utils.js';
import type { SortDirection } from './types.js';

export type { DataTableColumn, DataTableFilterValue } from './data-table-utils.js';

/** The column and direction a table is sorted by. */
export interface DataTableSort {
  column: string;
  direction: Exclude<SortDirection, 'none'>;
}

export interface DataTableRow<T> {
  /** From `getRowId`; stable across sorting, filtering and paging. */
  id: string;
  /** Position in `data`. */
  index: number;
  original: T;
  selected: boolean;
}

export interface DataTableOptions<T> {
  /**
   * The rows. Pass a getter to keep the table in step with changing data:
   * `createDataTable({ get data() { return rows; }, columns })`.
   */
  data: T[];
  columns: DataTableColumn<T>[];
  /** Stable id for a row. Defaults to its index in `data`, which does not survive reordering. */
  getRowId?: (row: T, index: number) => string;
  initialSort?: DataTableSort;
  /** Rows per page. `Infinity` turns paging off. */
  pageSize?: number;
  initialPage?: number;
  initialSearch?: string;
  initialFilters?: Record<string, DataTableFilterValue>;
  initialHidden?: string[];
  initialSelected?: string[];
  /** Row selection. Defaults to `'none'`. */
  selection?: 'none' | 'single' | 'multiple';
  isRowSelectable?: (row: T) => boolean;
  /**
   * Hand work to a server. A manual step leaves `data` as given — you sort, filter or page it
   * yourself in the matching callback and pass the result back in.
   */
  manual?: { sorting?: boolean; filtering?: boolean; pagination?: boolean };
  /** Total rows on the server. Required with manual pagination. */
  rowCount?: number;
  onSortChange?: (sort: DataTableSort | null) => void;
  onSearchChange?: (search: string) => void;
  onFiltersChange?: (filters: Record<string, DataTableFilterValue>) => void;
  onPageChange?: (page: { page: number; pageSize: number }) => void;
  onSelectionChange?: (selected: string[]) => void;
  onVisibilityChange?: (hidden: string[]) => void;
}

export interface DataTableState<T> {
  /** The current page of rows. */
  readonly rows: DataTableRow<T>[];
  /** Every row that passes search and filters, in sort order, across all pages. */
  readonly filteredRows: DataTableRow<T>[];
  /** Visible columns, in order. */
  readonly columns: DataTableColumn<T>[];
  readonly allColumns: DataTableColumn<T>[];
  /** Rows across all pages after filtering — or the server's `rowCount`. */
  readonly rowCount: number;
  /** 1-based, so it feeds `Pagination` directly. */
  readonly page: number;
  readonly pageSize: number;
  readonly pageCount: number;
  readonly sort: DataTableSort | null;
  readonly search: string;
  readonly filters: Record<string, DataTableFilterValue>;
  readonly selection: 'none' | 'single' | 'multiple';
  readonly selected: string[];
  readonly selectedCount: number;
  /** Every selectable row on this page is selected. */
  readonly allSelected: boolean;
  /** Some, but not all, selectable rows on this page are selected. */
  readonly someSelected: boolean;
  readonly hidden: string[];
  /** A column's sort state, ready for `TableHeader`'s `sort` prop. */
  sortOf(columnId: string): SortDirection;
  /** Sort by a column. Without a direction it goes ascending, then flips on repeat. */
  sortBy(columnId: string, direction?: DataTableSort['direction']): void;
  clearSort(): void;
  setSearch(search: string): void;
  /** Set a column filter; `null`, `''` or `[]` clears it. */
  setFilter(columnId: string, value: DataTableFilterValue | null): void;
  clearFilters(): void;
  setPage(page: number): void;
  setPageSize(size: number): void;
  next(): void;
  previous(): void;
  isSelected(rowId: string): boolean;
  isSelectable(row: DataTableRow<T>): boolean;
  /** Select, deselect (`on: false`) or toggle a row. In `single` mode selecting clears the rest. */
  select(rowId: string, on?: boolean): void;
  /** Select or clear every selectable row on the current page. */
  toggleAll(on?: boolean): void;
  clearSelection(): void;
  isVisible(columnId: string): boolean;
  setColumnVisible(columnId: string, visible: boolean): void;
  showAllColumns(): void;
  /** Counts of each value in a column, among rows passing every *other* filter. */
  facets(columnId: string): Map<string, number>;
  /** The text a cell shows. */
  format(row: T, column: DataTableColumn<T>): string;
  /** Back to the initial sort, search, filters, page, selection and visibility. */
  reset(): void;
}

const validPageSize = (size: number) => size === Infinity || (Number.isInteger(size) && size > 0);

/**
 * Table state without the table: sorting, search, column filters, paging, row selection and
 * column visibility over an array, in runes. Render it with `DataTable`, or feed its values to
 * `Table`, `TableHeader` and `Pagination` yourself.
 *
 * ```ts
 * const table = createDataTable({
 *   get data() { return sheets; },
 *   columns: [
 *     { id: 'name', header: 'Name', sortable: true },
 *     { id: 'layers', header: 'Layers', align: 'end', sortable: true },
 *   ],
 *   getRowId: (sheet) => sheet.id,
 *   pageSize: 25,
 * });
 * ```
 *
 * Works during SSR and outside components: state is set synchronously and nothing subscribes.
 */
export function createDataTable<T>(options: DataTableOptions<T>): DataTableState<T> {
  const {
    initialSort,
    pageSize: initialPageSize = 10,
    initialPage = 1,
    initialSearch = '',
    initialFilters = {},
    initialHidden = [],
    initialSelected = [],
    manual = {},
  } = options;

  const ids = options.columns.map((column) => column.id);
  const duplicate = ids.find((id, index) => ids.indexOf(id) !== index);
  if (duplicate !== undefined) {
    throw new RangeError(`createDataTable: duplicate column id "${duplicate}"`);
  }
  if (!validPageSize(initialPageSize)) {
    throw new RangeError('createDataTable: `pageSize` must be a positive integer or Infinity');
  }
  if (initialSort && !ids.includes(initialSort.column)) {
    throw new RangeError(`createDataTable: unknown initialSort column "${initialSort.column}"`);
  }
  if (manual.pagination && options.rowCount === undefined) {
    throw new RangeError('createDataTable: manual pagination needs `rowCount`');
  }

  let sort = $state<DataTableSort | null>(initialSort ?? null);
  let search = $state(initialSearch);
  let filters = $state<Record<string, DataTableFilterValue>>({ ...initialFilters });
  let page = $state(initialPage);
  let pageSize = $state(initialPageSize);
  const selected = new SvelteSet<string>(initialSelected);
  const hidden = new SvelteSet<string>(initialHidden);

  const selection = $derived(options.selection ?? 'none');
  const allColumns = $derived(options.columns);
  const columns = $derived(allColumns.filter((column) => !hidden.has(column.id)));
  const getRowId = $derived(options.getRowId ?? ((_row: T, index: number) => String(index)));

  const indexed = $derived(
    options.data.map((original, index) => ({ id: getRowId(original, index), index, original }))
  );

  const column = (id: string) => allColumns.find((one) => one.id === id);

  /** Rows passing the search and every filter except `skip` (for facet counts). */
  const passing = (skip?: string) => {
    if (manual.filtering) return indexed;
    return indexed.filter(({ original }) => {
      if (!matchesSearch(original, columns, search)) return false;
      for (const [id, value] of Object.entries(filters)) {
        if (id === skip || !isActiveFilter(value)) continue;
        const target = column(id);
        if (target && !matchesFilter(original, target, value)) return false;
      }
      return true;
    });
  };

  const filtered = $derived(passing());

  const sorted = $derived.by(() => {
    if (manual.sorting || !sort) return filtered;
    const target = column(sort.column);
    if (!target) return filtered;
    const compare = rowComparator(target, sort.direction === 'ascending' ? 1 : -1);
    return [...filtered].sort((a, b) => compare(a.original, b.original));
  });

  const rowCount = $derived(manual.pagination ? (options.rowCount ?? 0) : sorted.length);
  const pageCount = $derived(
    pageSize === Infinity ? 1 : Math.max(1, Math.ceil(rowCount / pageSize))
  );
  // Data can shrink under the current page; show the last page that still exists.
  const currentPage = $derived(Math.min(Math.max(1, page), pageCount));

  const withSelection = (row: { id: string; index: number; original: T }): DataTableRow<T> => ({
    ...row,
    selected: selected.has(row.id),
  });

  const filteredRows = $derived(sorted.map(withSelection));
  const rows = $derived(
    manual.pagination || pageSize === Infinity
      ? filteredRows
      : filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  );

  const isSelectable = (row: DataTableRow<T>) =>
    selection !== 'none' && (options.isRowSelectable?.(row.original) ?? true);
  const selectableOnPage = $derived(rows.filter(isSelectable));
  const allSelected = $derived(
    selectableOnPage.length > 0 && selectableOnPage.every((row) => selected.has(row.id))
  );
  const someSelected = $derived(
    !allSelected && selectableOnPage.some((row) => selected.has(row.id))
  );

  const emitPage = () => options.onPageChange?.({ page: currentPage, pageSize });
  const emitSelection = () => options.onSelectionChange?.([...selected]);
  const emitVisibility = () => options.onVisibilityChange?.([...hidden]);

  /** A narrower result set starts over at the first page. */
  const backToFirstPage = () => {
    if (page === 1) return;
    page = 1;
    emitPage();
  };

  function setPage(next: number) {
    const clamped = Math.min(Math.max(1, Math.trunc(next) || 1), pageCount);
    if (clamped === currentPage && clamped === page) return;
    page = clamped;
    emitPage();
  }

  function select(rowId: string, on?: boolean) {
    if (selection === 'none') return;
    const next = on ?? !selected.has(rowId);
    if (next === selected.has(rowId)) return;
    if (next && selection === 'single') selected.clear();
    if (next) selected.add(rowId);
    else selected.delete(rowId);
    emitSelection();
  }

  return {
    get rows() {
      return rows;
    },
    get filteredRows() {
      return filteredRows;
    },
    get columns() {
      return columns;
    },
    get allColumns() {
      return allColumns;
    },
    get rowCount() {
      return rowCount;
    },
    get page() {
      return currentPage;
    },
    get pageSize() {
      return pageSize;
    },
    get pageCount() {
      return pageCount;
    },
    get sort() {
      return sort;
    },
    get search() {
      return search;
    },
    get filters() {
      return filters;
    },
    get selection() {
      return selection;
    },
    get selected() {
      return [...selected];
    },
    get selectedCount() {
      return selected.size;
    },
    get allSelected() {
      return allSelected;
    },
    get someSelected() {
      return someSelected;
    },
    get hidden() {
      return [...hidden];
    },
    sortOf: (columnId) => (sort?.column === columnId ? sort.direction : 'none'),
    sortBy(columnId, direction) {
      if (!column(columnId)) return;
      const next =
        direction ??
        (sort?.column === columnId && sort.direction === 'ascending' ? 'descending' : 'ascending');
      sort = { column: columnId, direction: next };
      options.onSortChange?.(sort);
    },
    clearSort() {
      if (!sort) return;
      sort = null;
      options.onSortChange?.(null);
    },
    setSearch(next) {
      if (next === search) return;
      search = next;
      options.onSearchChange?.(next);
      backToFirstPage();
    },
    setFilter(columnId, value) {
      const { [columnId]: previous, ...rest } = filters;
      if (!isActiveFilter(value) && !isActiveFilter(previous)) return;
      filters = isActiveFilter(value) ? { ...rest, [columnId]: value! } : rest;
      options.onFiltersChange?.(filters);
      backToFirstPage();
    },
    clearFilters() {
      if (Object.keys(filters).length === 0) return;
      filters = {};
      options.onFiltersChange?.(filters);
      backToFirstPage();
    },
    setPage,
    setPageSize(size) {
      if (!validPageSize(size)) {
        throw new RangeError('createDataTable: `pageSize` must be a positive integer or Infinity');
      }
      if (size === pageSize) return;
      pageSize = size;
      page = 1;
      emitPage();
    },
    next: () => setPage(currentPage + 1),
    previous: () => setPage(currentPage - 1),
    isSelected: (rowId) => selected.has(rowId),
    isSelectable,
    select,
    toggleAll(on) {
      if (selection !== 'multiple') return;
      const next = on ?? !allSelected;
      let changed = false;
      for (const row of selectableOnPage) {
        if (selected.has(row.id) === next) continue;
        if (next) selected.add(row.id);
        else selected.delete(row.id);
        changed = true;
      }
      if (changed) emitSelection();
    },
    clearSelection() {
      if (selected.size === 0) return;
      selected.clear();
      emitSelection();
    },
    isVisible: (columnId) => !hidden.has(columnId),
    setColumnVisible(columnId, visible) {
      if (visible === !hidden.has(columnId)) return;
      if (visible) hidden.delete(columnId);
      else hidden.add(columnId);
      emitVisibility();
    },
    showAllColumns() {
      if (hidden.size === 0) return;
      hidden.clear();
      emitVisibility();
    },
    facets(columnId) {
      const target = column(columnId);
      // eslint-disable-next-line svelte/prefer-svelte-reactivity -- a fresh, read-only result
      if (!target) return new Map();
      return countValues(
        passing(columnId).map((row) => row.original),
        target
      );
    },
    format: (row, target) => formatCell(row, target),
    reset() {
      sort = initialSort ?? null;
      search = initialSearch;
      filters = { ...initialFilters };
      page = initialPage;
      pageSize = initialPageSize;
      selected.clear();
      for (const id of initialSelected) selected.add(id);
      hidden.clear();
      for (const id of initialHidden) hidden.add(id);
    },
  };
}
