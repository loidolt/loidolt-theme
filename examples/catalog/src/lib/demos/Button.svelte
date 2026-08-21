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
  <IconButton label="Add item">+</IconButton>
</div>
<div class="ldt-cluster" style="margin-top:0.75rem">
  <Button size="sm">Small</Button>
  <Button size="md">Medium</Button>
  <Button size="lg">Large</Button>
  <Button disabled>Disabled</Button>
</div>
