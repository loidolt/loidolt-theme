<script lang="ts">
  import { base } from '$app/paths';
  import { Button, Sidebar, Switch, Workspace } from '@loidolt/theme-svelte';
  import { sampleMedia } from '$lib/sample-media.js';

  let sidebarOpen = $state(true);
  let inspectorOpen = $state(true);
  let reviewSize = $state(45);
  const notesPercent = $derived(Math.round(reviewSize));

  // The first sample is a still: the ridge relief.
  const plate = sampleMedia(base).find((item) => item.kind === 'image')!;
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

<p class="ldt-utility-text" style="margin-block:1.5rem 0.75rem">
  Resizable — drag the divider, or focus it and use the arrow keys. Notes at {notesPercent}%.
</p>

<div class="docs-frame" data-testid="workspace-resizable">
  <Workspace
    resizable
    bind:inspectorSize={reviewSize}
    inspectorMinSize={25}
    inspectorMaxSize={75}
    storageKey="catalog-workspace-review"
    resizeLabel="Resize notes"
  >
    <img src={plate.src} alt={plate.alt} style="display:block;width:100%;height:auto" />
    {#snippet inspector()}
      <Sidebar side="right" label="Notes">
        <p class="ldt-eyebrow">Notes</p>
        <p>
          Ridge relief, cut from fourteen layers of birch ply. The contour spacing is even across
          the sheet; the darker band marks the valley floor.
        </p>
        <p class="ldt-utility-text">Reviewed against the source drawing</p>
      </Sidebar>
    {/snippet}
  </Workspace>
</div>
