<script lang="ts">
  import Sidebar from '../../src/lib/components/Sidebar.svelte';
  import Workspace from '../../src/lib/components/Workspace.svelte';

  let {
    withSidebar = false,
    withInspector = false,
    sidebarOpen = true,
    inspectorOpen = true,
  } = $props();
</script>

{#snippet main()}<p>Canvas</p>{/snippet}
{#snippet left()}<Sidebar label="Configuration">Settings</Sidebar>{/snippet}
{#snippet right()}<Sidebar side="right" label="Inspector">Details</Sidebar>{/snippet}

<Workspace
  data-testid="workspace"
  children={main}
  sidebar={withSidebar ? left : undefined}
  inspector={withInspector ? right : undefined}
  {sidebarOpen}
  {inspectorOpen}
/>
