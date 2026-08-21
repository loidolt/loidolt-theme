<script lang="ts">
  import { Badge, ContextBar } from '@loidolt/theme-svelte';
</script>

<ContextBar section="Terrain" title="Crater Lake" detail="Real-data preview ready">
  {#snippet actions()}<Badge variant="success">Live</Badge>{/snippet}
</ContextBar>
