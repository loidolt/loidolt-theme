<script lang="ts">
  import { Button, FloatingBar, IconButton } from '@loidolt/theme-svelte';
</script>

<div
  style="position: relative; height: 10rem; background: var(--loidolt-surface-sunken); border: var(--loidolt-border-width) solid var(--loidolt-border);"
>
  <FloatingBar label="Zoom">
    <IconButton label="Zoom in" size="sm">+</IconButton>
    <IconButton label="Zoom out" size="sm">−</IconButton>
    <Button size="sm" variant="quiet">Fit</Button>
  </FloatingBar>
</div>
