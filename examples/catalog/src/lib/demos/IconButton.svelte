<script lang="ts">
  import { IconButton, Tooltip } from '@loidolt/theme-svelte';
</script>

<div class="ldt-cluster">
  <IconButton label="Add layer">+</IconButton>
  <IconButton label="Remove layer" variant="quiet">-</IconButton>
  <IconButton label="Close" variant="ghost">x</IconButton>
  <IconButton label="Settings" size="sm">*</IconButton>
  <Tooltip content="Precise settings">
    {#snippet trigger()}#{/snippet}
  </Tooltip>
</div>
