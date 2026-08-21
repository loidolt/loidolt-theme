<script lang="ts">
  import { Badge, Brand, Button, Topbar } from '@loidolt/theme-svelte';
</script>

<Topbar navLabel="Editor">
  {#snippet brand()}<Brand name="Topo Studio" meta="Project 04" />{/snippet}
  {#snippet navigation()}
    <Button variant="ghost" size="sm">Design</Button>
    <Button variant="ghost" size="sm">Layers</Button>
  {/snippet}
  {#snippet actions()}
    <Badge variant="accent">Svelte 5</Badge>
    <Button variant="primary" size="sm">Export</Button>
  {/snippet}
</Topbar>
