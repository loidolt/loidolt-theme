<script lang="ts">
  import { IconButton, Tooltip, TooltipProvider } from '@loidolt/theme-svelte';
</script>

<TooltipProvider>
  <div class="ldt-cluster">
    <Tooltip content="Precise settings" triggerLabel="About precise settings">
      {#snippet trigger()}<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
          ><path d="M8 7v5M8 4v1" fill="none" stroke="currentColor" stroke-width="1.5" /></svg
        >{/snippet}
    </Tooltip>
    <Tooltip content="Adds a layer above the selection" arrow>
      {#snippet triggerChild({ props })}
        <IconButton {...props} label="Add layer" variant="quiet"
          ><svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
            ><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" /></svg
          ></IconButton
        >
      {/snippet}
    </Tooltip>
  </div>
</TooltipProvider>
