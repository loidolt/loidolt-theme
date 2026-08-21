<script lang="ts">
  import { Badge, Button } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <div class="ldt-cluster">
    <Badge>Draft</Badge>
    <Badge variant="accent">Live</Badge>
    <Badge variant="success">Ready</Badge>
    <Badge variant="warning">Review</Badge>
    <Badge variant="error">Blocked</Badge>
    <Badge variant="info">Queued</Badge>
  </div>
  <div class="ldt-cluster">
    <Button size="md">Export</Button>
    <Badge variant="accent" size="md">Sized to match</Badge>
    <Badge variant="accent">Inline default</Badge>
  </div>
</div>
