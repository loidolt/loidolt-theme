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
    <Badge variant="success" dot>Approved</Badge>
    <Badge variant="warning" dot>Changes requested</Badge>
  </div>
  <div class="ldt-cluster">
    <Badge variant="accent" count={4} label="unread comments" />
    <Badge variant="accent" count={140} label="queued jobs" />
  </div>
  <div class="ldt-cluster">
    <Button size="md">Export</Button>
    <Badge variant="accent" size="md">Sized to match</Badge>
  </div>
  <p>A job marked <Badge variant="accent">Inline default</Badge> sits in a line of text.</p>
</div>
