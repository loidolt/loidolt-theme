<script lang="ts">
  import EmptyState from '../../src/lib/components/EmptyState.svelte';
  import Table from '../../src/lib/components/Table.svelte';
  import TableHeader from '../../src/lib/components/TableHeader.svelte';
  import type { SortDirection } from '../../src/lib/types.js';

  interface Row {
    name: string;
    sheets: number;
  }

  let {
    rows = [] as Row[],
    sticky = false,
    onSort,
  }: {
    rows?: Row[];
    sticky?: boolean;
    onSort?: (column: 'name' | 'sheets', direction: SortDirection) => void;
  } = $props();

  let sort = $state<{ column: 'name' | 'sheets'; direction: SortDirection }>({
    column: 'name',
    direction: 'ascending',
  });

  const direction = (column: 'name' | 'sheets') =>
    sort.column === column ? sort.direction : 'none';

  function handle(column: 'name' | 'sheets', next: SortDirection) {
    sort = { column, direction: next };
    onSort?.(column, next);
  }
</script>

{#snippet nothingYet()}
  <EmptyState title="No cut files yet" description="Import a drawing to get started." />
{/snippet}

<Table caption="Cut files" {sticky} columns={2} empty={rows.length === 0 ? nothingYet : undefined}>
  <thead>
    <tr>
      <TableHeader sort={direction('name')} onSort={(next) => handle('name', next)}>
        Name
      </TableHeader>
      <TableHeader align="end" sort={direction('sheets')} onSort={(next) => handle('sheets', next)}>
        Sheets
      </TableHeader>
    </tr>
  </thead>
  <tbody>
    {#each rows as row (row.name)}
      <tr>
        <td>{row.name}</td>
        <td data-align="end">{row.sheets}</td>
      </tr>
    {/each}
  </tbody>
</Table>
