<script lang="ts">
  import { IconButton, Tooltip, TooltipProvider } from '@loidolt/theme-svelte';
</script>

<TooltipProvider>
  <div class="ldt-cluster">
    <Tooltip content="Precise settings">
      {#snippet trigger()}#{/snippet}
    </Tooltip>
    <Tooltip content="Adds a layer above the selection" arrow>
      {#snippet triggerChild({ props })}
        <IconButton {...props} label="Add layer">+</IconButton>
      {/snippet}
    </Tooltip>
  </div>
</TooltipProvider>
