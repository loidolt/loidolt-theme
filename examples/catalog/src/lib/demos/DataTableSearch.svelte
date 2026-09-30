<script lang="ts">
  import {
    createDataTable,
    DataTable,
    DataTablePagination,
    DataTableSearch,
  } from '@loidolt/theme-svelte';
  import { sampleSheets } from '$lib/sample-sheets.js';

  const table = createDataTable({
    data: sampleSheets,
    columns: [
      { id: 'name', header: 'Name', sortable: true, hideable: false },
      { id: 'stock', header: 'Stock' },
      { id: 'status', header: 'Status' },
      { id: 'layers', header: 'Layers', align: 'end' },
    ],
    getRowId: (sheet) => sheet.id,
    pageSize: 5,
  });
</script>

<div class="ldt-stack">
  <DataTableSearch {table} placeholder="Search sheets" />
  <DataTable {table} caption="Cut sheets" />
  <DataTablePagination {table} pageSizes={[5, 10, 20]} />
</div>
