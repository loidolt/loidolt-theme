<script lang="ts">
  import { Button, IconButton } from '@loidolt/theme-svelte';
</script>

<div class="ldt-cluster">
  <Button variant="primary">Primary action</Button>
  <Button>Default</Button>
  <Button variant="quiet">Quiet</Button>
  <Button variant="danger">Destructive</Button>
  <Button variant="ghost">Ghost</Button>
  <Button variant="text">Text action</Button>
  <Button loading loadingText="Building">Build</Button>
  <Button href="https://example.com" variant="quiet">Link</Button>
</div>
<div class="ldt-cluster" style="margin-top:0.75rem">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
</div>
<div class="ldt-cluster" style="margin-top:0.75rem">
  <Button disabled>Disabled</Button>
  <IconButton label="Add item" variant="quiet">
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true"
      ><path d="M8 3v10M3 8h10" fill="none" stroke="currentColor" stroke-width="1.5" /></svg
    >
  </IconButton>
</div>
