<script lang="ts">
  import { Badge, Table, TableHeader } from '@loidolt/theme-svelte';
  import type { SortDirection } from '@loidolt/theme-svelte';

  type Row = {
    project: string;
    format: string;
    sheets: number;
    status: 'Ready' | 'Review' | 'Draft';
  };

  const data: Row[] = [
    { project: 'Crater Lake', format: 'SVG', sheets: 12, status: 'Ready' },
    { project: 'Grand Teton', format: 'PDF', sheets: 4, status: 'Review' },
    { project: 'Rainier', format: 'SVG', sheets: 31, status: 'Draft' },
  ];

  const tone = { Ready: 'success', Review: 'warning', Draft: 'default' } as const;

  let sort = $state<{ column: keyof Row; direction: SortDirection }>({
    column: 'project',
    direction: 'ascending',
  });

  const rows = $derived(
    [...data].sort((a, b) => {
      const factor = sort.direction === 'descending' ? -1 : 1;
      const left = a[sort.column];
      const right = b[sort.column];
      return typeof left === 'number' && typeof right === 'number'
        ? (left - right) * factor
        : String(left).localeCompare(String(right)) * factor;
    })
  );

  const directionOf = (column: keyof Row): SortDirection =>
    sort.column === column ? sort.direction : 'none';
</script>

<Table caption="Recent projects" sticky>
  <thead>
    <tr>
      <TableHeader
        sort={directionOf('project')}
        onSort={(direction) => (sort = { column: 'project', direction })}>Project</TableHeader
      >
      <TableHeader>Format</TableHeader>
      <TableHeader
        align="end"
        sort={directionOf('sheets')}
        onSort={(direction) => (sort = { column: 'sheets', direction })}>Sheets</TableHeader
      >
      <TableHeader>Status</TableHeader>
    </tr>
  </thead>
  <tbody>
    {#each rows as row (row.project)}
      <tr>
        <td>{row.project}</td>
        <td>{row.format}</td>
        <td data-align="end">{row.sheets}</td>
        <td><Badge variant={tone[row.status]}>{row.status}</Badge></td>
      </tr>
    {/each}
  </tbody>
</Table>
