<script lang="ts">
  import { ActiveFilterChips, Button } from '@loidolt/theme-svelte';

  const all = [
    { value: 'status', label: 'Status: Ready' },
    { value: 'stock', label: 'Stock: Birch ply' },
    { value: 'owner', label: 'Owner: Me' },
  ];
  let items = $state([...all]);
</script>

<div class="ldt-stack">
  <ActiveFilterChips
    {items}
    onRemove={(value) => (items = items.filter((item) => item.value !== value))}
    onClearAll={() => (items = [])}
  />
  {#if items.length === 0}<Button size="sm" variant="quiet" onclick={() => (items = [...all])}
      >Restore filters</Button
    >{/if}
</div>
