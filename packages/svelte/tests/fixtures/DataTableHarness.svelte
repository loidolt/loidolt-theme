<script lang="ts">
  import DataTable from '../../src/lib/components/DataTable.svelte';
  import DataTableColumnVisibility from '../../src/lib/components/DataTableColumnVisibility.svelte';
  import DataTableFacetedFilter from '../../src/lib/components/DataTableFacetedFilter.svelte';
  import DataTablePagination from '../../src/lib/components/DataTablePagination.svelte';
  import DataTableSearch from '../../src/lib/components/DataTableSearch.svelte';
  import { untrack } from 'svelte';
  import { createDataTable, type DataTableOptions } from '../../src/lib/data-table.svelte.js';

  interface Sheet {
    id: string;
    name: string;
    stock: string;
    layers: number;
  }

  interface Props {
    count?: number;
    options?: Partial<DataTableOptions<Sheet>>;
    loading?: boolean;
    virtual?: { rowHeight: number; overscan?: number };
    editable?: boolean;
    onEdit?: (row: Sheet, column: string, value: string) => void;
  }

  let {
    count = 12,
    options = {},
    loading = false,
    virtual,
    editable = false,
    onEdit,
  }: Props = $props();

  const stocks = ['birch', 'acrylic', 'cork'];
  // A fixture: props are read once, on purpose.
  const initial = untrack(() => ({ count, editable, options }));
  let data = $state(
    Array.from({ length: initial.count }, (_, index) => ({
      id: `s${index + 1}`,
      name: `Sheet ${index + 1}`,
      stock: stocks[index % 3],
      layers: (index * 7) % 13,
    }))
  );

  const table = createDataTable<Sheet>({
    get data() {
      return data;
    },
    columns: [
      { id: 'name', header: 'Name', sortable: true, editable: initial.editable },
      { id: 'stock', header: 'Stock', hideBelow: 'compact' },
      { id: 'layers', header: 'Layers', sortable: true, align: 'end', hideable: false },
    ],
    getRowId: (sheet) => sheet.id,
    pageSize: 5,
    ...initial.options,
  });
</script>

<DataTableSearch {table} debounce={0} />
<DataTableSearch {table} column="name" label="Name filter" debounce={0} />
<DataTableFacetedFilter {table} column="stock" />
<DataTableColumnVisibility {table} />
<DataTable
  {table}
  caption="Sheets"
  {loading}
  {virtual}
  sticky={Boolean(virtual)}
  onCellEdit={onEdit
    ? (row, column, value) => {
        onEdit(row, column, value);
        data = data.map((one) => (one.id === row.id ? { ...one, [column]: value } : one));
      }
    : undefined}
/>
<DataTablePagination {table} pageSizes={[5, 10]} />
<button type="button" onclick={() => table.reset()}>Reset</button>
