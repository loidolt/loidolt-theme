<script lang="ts">
  import { Badge, Button, Card } from '@loidolt/theme-svelte';
</script>

<Card title="Terrain project" description="Crater Lake, Oregon">
  A composed card for general application content.
  {#snippet footer()}
    <div class="ldt-cluster">
      <Badge variant="success">Ready</Badge>
      <Button variant="text">Open</Button>
    </div>
  {/snippet}
</Card>
