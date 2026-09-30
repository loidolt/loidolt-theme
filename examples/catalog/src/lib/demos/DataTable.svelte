<script lang="ts">
  import {
    Badge,
    createDataTable,
    DataTable,
    DataTableColumnVisibility,
    DataTableFacetedFilter,
    DataTablePagination,
    DataTableSearch,
    Toolbar,
  } from '@loidolt/theme-svelte';
  import { sampleSheets, type SampleSheet } from '$lib/sample-sheets.js';

  let sheets = $state(sampleSheets);

  const table = createDataTable<SampleSheet>({
    get data() {
      return sheets;
    },
    columns: [
      { id: 'name', header: 'Name', sortable: true, hideable: false, editable: true },
      { id: 'stock', header: 'Stock', sortable: true, hideBelow: 'compact' },
      { id: 'status', header: 'Status', sortable: true, cell: status },
      { id: 'layers', header: 'Layers', sortable: true, align: 'end' },
      {
        id: 'updated',
        header: 'Updated',
        sortable: true,
        align: 'end',
        hideBelow: 'expanded',
        format: (value) =>
          (value as Date).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            timeZone: 'UTC',
          }),
      },
    ],
    getRowId: (sheet) => sheet.id,
    initialSort: { column: 'name', direction: 'ascending' },
    pageSize: 8,
    selection: 'multiple',
  });
</script>

{#snippet status(sheet: SampleSheet)}
  <Badge
    variant={sheet.status === 'Ready'
      ? 'success'
      : sheet.status === 'Blocked'
        ? 'error'
        : 'warning'}
    dot>{sheet.status}</Badge
  >
{/snippet}

<div class="ldt-stack">
  <Toolbar label="Sheet tools">
    <DataTableSearch {table} placeholder="Search sheets" style="max-width: 16rem" />
    <DataTableFacetedFilter {table} column="stock" />
    <DataTableFacetedFilter {table} column="status" />
    {#snippet end()}<DataTableColumnVisibility {table} />{/snippet}
  </Toolbar>
  <DataTable
    {table}
    caption="Cut sheets"
    selectLabel={(sheet) => `Select ${sheet.name}`}
    onCellEdit={(sheet, column, value) =>
      (sheets = sheets.map((one) => (one.id === sheet.id ? { ...one, [column]: value } : one)))}
  />
  <DataTablePagination {table} pageSizes={[8, 16, 32]} />
</div>
