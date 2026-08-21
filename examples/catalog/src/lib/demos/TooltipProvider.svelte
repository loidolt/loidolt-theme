<script lang="ts">
  import { Tooltip, TooltipProvider } from '@loidolt/theme-svelte';
</script>

<TooltipProvider delayDuration={200}>
  <div class="ldt-cluster">
    <Tooltip content="First">{#snippet trigger()}One{/snippet}</Tooltip>
    <Tooltip content="Second">{#snippet trigger()}Two{/snippet}</Tooltip>
    <Tooltip content="Third">{#snippet trigger()}Three{/snippet}</Tooltip>
  </div>
</TooltipProvider>
<p class="ldt-utility-text">
  Hover one, then another: the second opens immediately, because the provider groups them.
</p>
