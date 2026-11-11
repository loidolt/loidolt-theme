<script lang="ts">
  import { Tooltip, TooltipProvider } from '@loidolt/theme-svelte';

  // Words, not glyphs, so they take a button's width rather than the square icon button's.
  const triggerClass = 'ldt-button ldt-button--quiet ldt-button--sm';
</script>

<TooltipProvider delayDuration={200}>
  <div class="ldt-cluster">
    <Tooltip content="First" {triggerClass}>{#snippet trigger()}One{/snippet}</Tooltip>
    <Tooltip content="Second" {triggerClass}>{#snippet trigger()}Two{/snippet}</Tooltip>
    <Tooltip content="Third" {triggerClass}>{#snippet trigger()}Three{/snippet}</Tooltip>
  </div>
</TooltipProvider>
<p class="ldt-utility-text">
  Hover or focus one, then another: the second opens immediately, because the provider groups them.
</p>
