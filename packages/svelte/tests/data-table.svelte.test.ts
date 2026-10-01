import { flushSync } from 'svelte';
import { describe, expect, it, vi } from 'vitest';
import {
  cellValue,
  compareValues,
  countValues,
  formatCell,
  matchesFilter,
  matchesSearch,
  sortRows,
  type DataTableColumn,
} from '../src/lib/data-table-utils.js';
import { createDataTable } from '../src/lib/data-table.svelte.js';

interface Sheet {
  id: string;
  name: string;
  layers: number | null;
  stock: string;
  tags: string[];
  cut?: Date;
}

const sheets: Sheet[] = [
  {
    id: 'a',
    name: 'Sheet 10',
    layers: 4,
    stock: 'birch',
    tags: ['proof'],
    cut: new Date(2026, 0, 3),
  },
  { id: 'b', name: 'Sheet 2', layers: 12, stock: 'acrylic', tags: [] },
  { id: 'c', name: 'Bracket', layers: null, stock: 'birch', tags: ['proof', 'rush'] },
  { id: 'd', name: 'Coaster', layers: 1, stock: 'cork', tags: ['rush'] },
  { id: 'e', name: 'Sign', layers: 7, stock: 'acrylic', tags: [] },
];

const columns: DataTableColumn<Sheet>[] = [
  { id: 'name', header: 'Name', sortable: true },
  { id: 'layers', header: 'Layers', sortable: true, align: 'end' },
  { id: 'stock', header: 'Stock', format: (value) => String(value).toUpperCase() },
  { id: 'tags', header: 'Tags', searchable: false },
  { id: 'cut', header: 'Cut', accessor: (row) => row.cut },
];

const table = (options: Partial<Parameters<typeof createDataTable<Sheet>>[0]> = {}) =>
  createDataTable<Sheet>({ data: sheets, columns, getRowId: (row) => row.id, ...options });

const ids = (rows: { id: string }[]) => rows.map((row) => row.id);

describe('data table helpers', () => {
  it('reads values by key, accessor or id, and formats them', () => {
    expect(cellValue(sheets[0], { id: 'x', header: 'X', accessor: 'layers' })).toBe(4);
    expect(cellValue(sheets[0], columns[4])).toBeInstanceOf(Date);
    expect(formatCell(sheets[0], columns[2])).toBe('BIRCH');
    expect(formatCell(sheets[2], columns[1])).toBe('');
    expect(formatCell(sheets[2], columns[3])).toBe('proof, rush');
    expect(formatCell(sheets[0], columns[4])).toBe(new Date(2026, 0, 3).toLocaleDateString());
    expect(formatCell({ ...sheets[0], cut: new Date('nope') }, columns[4])).toBe('');
  });

  it('orders numbers, dates, booleans and natural text', () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
    expect(compareValues(new Date(2), new Date(1))).toBeGreaterThan(0);
    expect(compareValues(false, true)).toBeLessThan(0);
    expect(compareValues('Sheet 2', 'Sheet 10')).toBeLessThan(0);
    const byLayers = sortRows(sheets, columns[1], -1).map((row) => row.layers);
    // Empty values stay last in both directions.
    expect(byLayers).toEqual([12, 7, 4, 1, null]);
    const custom = sortRows(
      sheets,
      { ...columns[0], compare: (a, b) => a.id.localeCompare(b.id) },
      -1
    );
    expect(custom[0].id).toBe('e');
  });

  it('filters by substring, by set membership, and by a custom test', () => {
    expect(matchesFilter(sheets[0], columns[2], 'IRC')).toBe(true);
    expect(matchesFilter(sheets[0], columns[2], ['acrylic'])).toBe(false);
    expect(matchesFilter(sheets[2], columns[3], ['rush'])).toBe(true);
    expect(matchesFilter(sheets[1], columns[3], ['rush'])).toBe(false);
    expect(matchesFilter(sheets[0], { ...columns[1], filter: () => false }, 'x')).toBe(false);
    expect(matchesSearch(sheets[0], columns, '  ')).toBe(true);
    // `tags` is not searchable.
    expect(matchesSearch(sheets[3], columns, 'rush')).toBe(false);
  });

  it('counts values, spreading lists and skipping blanks', () => {
    expect([...countValues(sheets, columns[3])]).toEqual([
      ['proof', 2],
      ['rush', 2],
    ]);
  });
});

describe('createDataTable', () => {
  it('pages, sorts and reports each change', () => {
    const onSortChange = vi.fn();
    const onPageChange = vi.fn();
    const state = table({ pageSize: 2, onSortChange, onPageChange });
    expect(state.pageCount).toBe(3);
    expect(ids(state.rows)).toEqual(['a', 'b']);

    state.sortBy('name');
    expect(state.sortOf('name')).toBe('ascending');
    expect(state.sortOf('layers')).toBe('none');
    expect(ids(state.rows)).toEqual(['c', 'd']);
    state.sortBy('name');
    expect(state.sort).toEqual({ column: 'name', direction: 'descending' });
    expect(onSortChange).toHaveBeenLastCalledWith({ column: 'name', direction: 'descending' });
    state.sortBy('missing');
    expect(state.sort?.column).toBe('name');

    state.next();
    expect(state.page).toBe(2);
    expect(onPageChange).toHaveBeenLastCalledWith({ page: 2, pageSize: 2 });
    state.next();
    state.next();
    expect(state.page).toBe(3);
    state.previous();
    state.setPage(99);
    expect(state.page).toBe(3);
    state.setPage(Number.NaN);
    expect(state.page).toBe(1);

    state.clearSort();
    expect(state.sort).toBeNull();
    expect(onSortChange).toHaveBeenLastCalledWith(null);
    state.clearSort();
    expect(onSortChange).toHaveBeenCalledTimes(3);
  });

  it('searches and filters, returning to the first page, and counts facets', () => {
    const onSearchChange = vi.fn();
    const onFiltersChange = vi.fn();
    const state = table({ pageSize: 2, initialPage: 2, onSearchChange, onFiltersChange });
    expect(state.page).toBe(2);

    state.setSearch('sheet');
    expect(state.page).toBe(1);
    expect(state.rowCount).toBe(2);
    expect(onSearchChange).toHaveBeenCalledWith('sheet');
    state.setSearch('sheet');
    expect(onSearchChange).toHaveBeenCalledOnce();
    state.setSearch('');

    state.setFilter('stock', ['birch', 'cork']);
    expect(ids(state.filteredRows)).toEqual(['a', 'c', 'd']);
    expect(onFiltersChange).toHaveBeenLastCalledWith({ stock: ['birch', 'cork'] });
    // Facets for a column ignore that column's own filter, so every choice stays visible.
    expect(state.facets('stock').get('acrylic')).toBe(2);
    expect(state.facets('tags').get('rush')).toBe(2);
    expect(state.facets('nope').size).toBe(0);

    state.setFilter('name', 'co');
    expect(ids(state.filteredRows)).toEqual(['d']);
    state.setFilter('name', null);
    // Clearing an already-clear filter is not a change.
    state.setFilter('name', '');
    expect(onFiltersChange).toHaveBeenCalledTimes(3);
    state.setFilter('ghost', 'x');
    expect(state.filteredRows).toHaveLength(3);
    state.clearFilters();
    state.clearFilters();
    expect(state.filteredRows).toHaveLength(5);
  });

  it('selects rows in single and multiple modes, page by page', () => {
    const onSelectionChange = vi.fn();
    const state = table({
      pageSize: 2,
      selection: 'multiple',
      isRowSelectable: (row) => row.id !== 'b',
      onSelectionChange,
    });
    expect(state.isSelectable(state.rows[1])).toBe(false);
    state.toggleAll();
    expect(state.selected).toEqual(['a']);
    expect(state.allSelected).toBe(true);
    state.select('a');
    expect(state.someSelected).toBe(false);
    state.select('a', true);
    state.select('a', true);
    expect(onSelectionChange).toHaveBeenCalledTimes(3);
    state.next();
    state.select('c');
    expect(state.someSelected).toBe(true);
    state.toggleAll(false);
    expect(state.selected).toEqual(['a']);
    expect(state.rows[0].selected).toBe(false);
    state.clearSelection();
    state.clearSelection();
    expect(state.selectedCount).toBe(0);

    const single = table({ selection: 'single' });
    single.select('a');
    single.select('b');
    expect(single.selected).toEqual(['b']);
    single.toggleAll();
    expect(single.selected).toEqual(['b']);

    const none = table();
    none.select('a');
    expect(none.selected).toEqual([]);
    expect(none.isSelectable(none.rows[0])).toBe(false);
  });

  it('hides and shows columns', () => {
    const onVisibilityChange = vi.fn();
    const state = table({ initialHidden: ['tags'], onVisibilityChange });
    expect(state.columns.map((column) => column.id)).not.toContain('tags');
    expect(state.allColumns).toHaveLength(5);
    state.setColumnVisible('cut', false);
    state.setColumnVisible('cut', false);
    expect(state.hidden).toEqual(['tags', 'cut']);
    expect(state.isVisible('cut')).toBe(false);
    // Hidden columns drop out of the search too.
    state.setSearch(new Date(2026, 0, 3).toLocaleDateString());
    expect(state.rowCount).toBe(0);
    state.setColumnVisible('cut', true);
    expect(state.rowCount).toBe(1);
    state.showAllColumns();
    state.showAllColumns();
    expect(onVisibilityChange).toHaveBeenCalledTimes(3);
  });

  it('changes page size, turns paging off with Infinity, and rejects bad sizes', () => {
    const state = table({ pageSize: 2, initialPage: 3 });
    state.setPageSize(2);
    expect(state.page).toBe(3);
    state.setPageSize(4);
    expect(state.page).toBe(1);
    expect(state.pageCount).toBe(2);
    state.setPageSize(Infinity);
    expect(state.rows).toHaveLength(5);
    expect(state.pageCount).toBe(1);
    expect(() => state.setPageSize(0)).toThrow(/pageSize/);
  });

  it('leaves data alone in manual modes and trusts the server row count', () => {
    const state = table({
      pageSize: 2,
      manual: { sorting: true, filtering: true, pagination: true },
      rowCount: 40,
      initialSort: { column: 'layers', direction: 'descending' },
    });
    state.setSearch('zzz');
    state.setFilter('stock', ['cork']);
    expect(ids(state.rows)).toEqual(['a', 'b', 'c', 'd', 'e']);
    expect(state.rowCount).toBe(40);
    expect(state.pageCount).toBe(20);
    state.setPage(7);
    expect(state.page).toBe(7);
  });

  it('follows changing data through a getter and clamps a vanished page', () => {
    let data = $state(sheets);
    const state = createDataTable<Sheet>({
      get data() {
        return data;
      },
      columns,
      pageSize: 2,
      initialPage: 3,
    });
    expect(ids(state.rows)).toEqual(['4']);
    data = sheets.slice(0, 2);
    flushSync();
    expect(state.page).toBe(1);
    expect(ids(state.rows)).toEqual(['0', '1']);
  });

  it('resets to its initial state', () => {
    const state = table({
      initialSort: { column: 'name', direction: 'ascending' },
      initialSelected: ['a'],
      initialHidden: ['tags'],
      selection: 'multiple',
      initialFilters: { stock: 'birch' },
    });
    state.clearSort();
    state.clearFilters();
    state.select('b');
    state.showAllColumns();
    state.reset();
    expect(state.sort).toEqual({ column: 'name', direction: 'ascending' });
    expect(state.filters).toEqual({ stock: 'birch' });
    expect(state.selected).toEqual(['a']);
    expect(state.hidden).toEqual(['tags']);
    expect(state.format(sheets[0], columns[2])).toBe('BIRCH');
  });

  it('rejects contradictory options', () => {
    expect(() => table({ columns: [columns[0], columns[0]] })).toThrow(
      /duplicate column id "name"/
    );
    expect(() => table({ pageSize: 1.5 })).toThrow(/pageSize/);
    expect(() => table({ initialSort: { column: 'x', direction: 'ascending' } })).toThrow(
      /unknown initialSort column "x"/
    );
    expect(() => table({ manual: { pagination: true } })).toThrow(/rowCount/);
  });
});
