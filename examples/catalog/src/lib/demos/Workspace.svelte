<script lang="ts">
  import { Button, Sidebar, Switch, Workspace } from '@loidolt/theme-svelte';

  let sidebarOpen = $state(true);
  let inspectorOpen = $state(true);
</script>

<div class="ldt-cluster" style="margin-bottom:0.75rem">
  <Switch bind:checked={sidebarOpen}>Sidebar</Switch>
  <Switch bind:checked={inspectorOpen}>Inspector</Switch>
</div>

<div class="docs-frame">
  <Workspace {sidebarOpen} {inspectorOpen}>
    {#snippet sidebar()}
      <Sidebar label="Configuration">
        <p class="ldt-eyebrow">Configuration</p>
        <Button variant="quiet" size="sm">Add layer</Button>
      </Sidebar>
    {/snippet}
    <div class="docs-canvas">Canvas</div>
    {#snippet inspector()}
      <Sidebar side="right" label="Inspector">
        <p class="ldt-eyebrow">Inspector</p>
        <p class="ldt-utility-text">12 layers</p>
      </Sidebar>
    {/snippet}
  </Workspace>
</div>
