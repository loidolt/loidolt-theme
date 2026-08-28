<script lang="ts">
  import { AppShell, Brand, ContextBar, Topbar } from '@loidolt/theme-svelte';
</script>

<div class="docs-frame">
  <AppShell mainId="demo-app-shell-main" embedded>
    {#snippet header()}
      <Topbar navLabel="Demo">
        {#snippet brand()}<Brand name="Topo Studio" meta="Shell" />{/snippet}
      </Topbar>
      <ContextBar section="Terrain" title="Crater Lake" />
    {/snippet}
    <p style="padding:1rem">Main content sits in the middle row and takes the remaining height.</p>
    {#snippet footer()}<p style="padding:0.75rem 1rem" class="ldt-utility-text">Footer</p>{/snippet}
  </AppShell>
</div>
