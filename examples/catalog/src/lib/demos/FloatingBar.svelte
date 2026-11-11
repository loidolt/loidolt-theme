<script lang="ts">
  import { Button, FloatingBar, IconButton } from '@loidolt/theme-svelte';
</script>

<div
  style="position: relative; height: 10rem; background: var(--loidolt-surface-sunken); border: var(--loidolt-border-width) solid var(--loidolt-border);"
>
  <FloatingBar label="Zoom">
    <IconButton label="Zoom in" size="sm" variant="quiet"
      ><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
        ><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" /></svg
      ></IconButton
    >
    <IconButton label="Zoom out" size="sm" variant="quiet"
      ><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true"
        ><path d="M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" /></svg
      ></IconButton
    >
    <Button size="sm" variant="quiet">Fit</Button>
  </FloatingBar>
</div>
