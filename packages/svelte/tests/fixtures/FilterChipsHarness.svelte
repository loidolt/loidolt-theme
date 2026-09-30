<script lang="ts">
  import ActiveFilterChips from '../../src/lib/components/ActiveFilterChips.svelte';

  let items = $state([
    { value: 'status', label: 'Status: Ready' },
    { value: 'stock', label: 'Stock: Birch' },
    { value: 'owner', label: 'Owner: Me' },
  ]);
</script>

<ActiveFilterChips
  {items}
  onRemove={(value) => (items = items.filter((item) => item.value !== value))}
  onClearAll={() => (items = [])}
/>
<p>{items.length} filters</p>
