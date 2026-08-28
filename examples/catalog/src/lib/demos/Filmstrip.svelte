<script lang="ts">
  import { Filmstrip, StatusDot, Thumbnail } from '@loidolt/theme-svelte';

  const items = [
    { id: 'a', label: '#1', variant: 'success' as const },
    { id: 'b', label: '#2', variant: 'warning' as const },
    { id: 'c', label: '#3', variant: 'default' as const },
  ];
  let selectedId = $state<string | null>('a');
</script>

<div style="max-width: 10rem;">
  <Filmstrip {items} bind:selectedId label="Outputs">
    {#snippet item(entry)}
      <Thumbnail surface="paper" ratio="4/3" alt="">
        <svg viewBox="0 0 40 30" width="60"
          ><rect x="8" y="8" width="24" height="14" fill="#888" /></svg
        >
      </Thumbnail>
      <span class="ldt-cluster" style="--ldt-gap: 0.35rem;">
        <StatusDot variant={entry.variant} label={entry.variant} />
        {entry.label}
      </span>
    {/snippet}
  </Filmstrip>
</div>
