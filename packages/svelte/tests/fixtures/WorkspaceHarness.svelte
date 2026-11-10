<script lang="ts">
  import Sidebar from '../../src/lib/components/Sidebar.svelte';
  import Workspace from '../../src/lib/components/Workspace.svelte';

  let {
    withSidebar = false,
    withInspector = false,
    sidebarOpen = true,
    inspectorOpen = true,
    resizable = false,
    inspectorSize = $bindable(30),
    inspectorMinSize = undefined,
    inspectorMaxSize = undefined,
    storageKey = undefined,
    resizeLabel = undefined,
    dir = undefined,
  }: {
    withSidebar?: boolean;
    withInspector?: boolean;
    sidebarOpen?: boolean;
    inspectorOpen?: boolean;
    resizable?: boolean;
    inspectorSize?: number;
    inspectorMinSize?: number;
    inspectorMaxSize?: number;
    storageKey?: string;
    resizeLabel?: string;
    dir?: 'ltr' | 'rtl';
  } = $props();
</script>

{#snippet main()}<p>Canvas</p>{/snippet}
{#snippet left()}<Sidebar label="Configuration">Settings</Sidebar>{/snippet}
{#snippet right()}<Sidebar side="right" label="Inspector">Details</Sidebar>{/snippet}

<Workspace
  data-testid="workspace"
  style={dir === 'rtl' ? 'direction: rtl' : undefined}
  children={main}
  sidebar={withSidebar ? left : undefined}
  inspector={withInspector ? right : undefined}
  {sidebarOpen}
  {inspectorOpen}
  {resizable}
  bind:inspectorSize
  {inspectorMinSize}
  {inspectorMaxSize}
  {storageKey}
  {resizeLabel}
/>
<output data-testid="size">{inspectorSize}</output>
