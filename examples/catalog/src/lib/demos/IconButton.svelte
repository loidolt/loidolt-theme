<script lang="ts">
  import { IconButton, Tooltip } from '@loidolt/theme-svelte';
</script>

{#snippet icon(d: string)}
  <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"
    ><path {d} fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="square" /></svg
  >
{/snippet}

<div class="ldt-cluster">
  <IconButton label="Add layer" variant="default">{@render icon('M8 3v10M3 8h10')}</IconButton>
  <IconButton label="Remove layer" variant="quiet">{@render icon('M3 8h10')}</IconButton>
  <IconButton label="Close" variant="ghost">{@render icon('m4 4 8 8M12 4l-8 8')}</IconButton>
  <IconButton label="Settings" size="sm" variant="quiet"
    >{@render icon('M2 5h12M2 11h12M5 3v4M11 9v4')}</IconButton
  >
  <Tooltip content="Precise settings" triggerLabel="About precise settings">
    {#snippet trigger()}{@render icon('M8 7v5M8 4v1')}{/snippet}
  </Tooltip>
</div>
