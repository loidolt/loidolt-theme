<script lang="ts">
  import { Button, EmptyState, Table } from '@loidolt/theme-svelte';
</script>

{#snippet nothingYet()}
  <EmptyState title="No cut files yet" description="Import a drawing to get started.">
    {#snippet actions()}<Button variant="primary" size="sm">Import drawing</Button>{/snippet}
  </EmptyState>
{/snippet}

<div class="ldt-stack">
  <EmptyState title="No projects yet" description="Create one to get going.">
    {#snippet actions()}
      <Button variant="primary" size="sm">New project</Button>
      <Button variant="quiet" size="sm">Import</Button>
    {/snippet}
  </EmptyState>

  <Table caption="Cut files" columns={2} empty={nothingYet}>
    <thead><tr><th>Name</th><th>Sheets</th></tr></thead>
  </Table>
</div>
