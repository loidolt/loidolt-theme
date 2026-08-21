<script lang="ts">
  import { Table, TableHeader } from '@loidolt/theme-svelte';
  import type { SortDirection } from '@loidolt/theme-svelte';

  let direction = $state<SortDirection>('ascending');
</script>

<Table caption="Sort states">
  <thead>
    <tr>
      <TableHeader sort={direction} onSort={(next) => (direction = next)}>Sortable</TableHeader>
      <TableHeader>Plain</TableHeader>
      <TableHeader align="end">Right-aligned</TableHeader>
    </tr>
  </thead>
  <tbody>
    <tr><td>Press the first header</td><td>Not a control</td><td data-align="end">128</td></tr>
  </tbody>
</Table>
