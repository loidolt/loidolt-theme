<script lang="ts">
  import { base } from '$app/paths';
  import {
    Badge,
    Brand,
    Button,
    ContextBar,
    Drawer,
    Field,
    NumberField,
    PageHeader,
    Section,
    Select,
    Sidebar,
    Switch,
    Topbar,
    Workspace,
  } from '@loidolt/theme-svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import Demo from '$lib/components/Demo.svelte';

  /*
   * Assembled from two pieces on purpose: a closing script tag written literally anywhere in
   * here — string, comment, or code — ends this component's own script block.
   */
  const endScript = `</${'script'}>`;

  let layers = $state(12);
  let guides = $state(true);
  let format = $state('svg');
  let sidebarOpen = $state(true);

  const responsive = `<script lang="ts">
  import { breakpointQuery, createMediaQuery, Drawer, Sidebar, Workspace } from '@loidolt/theme-svelte';

  const compact = createMediaQuery(breakpointQuery('compact'));
  let navOpen = $state(false);
${endScript}

{#if compact.matches}
  <Drawer title="Navigation" bind:open={navOpen}>
    {#snippet trigger()}Menu{/snippet}
    {@render nav()}
  </Drawer>
{/if}

<Workspace sidebarOpen={!compact.matches}>
  {#snippet sidebar()}<Sidebar label="Navigation">{@render nav()}</Sidebar>{/snippet}
  <main>…</main>
</Workspace>`;

  const collapse = `<!-- A pane collapses by not being rendered, so nothing inside it
     stays in the tab order while it is hidden. -->
<Workspace {sidebarOpen} {inspectorOpen}>…</Workspace>`;

  const emptyTable = `{#snippet nothingYet()}
  <EmptyState title="No cut files yet" description="Import a drawing to get started." />
{/snippet}

<Table caption="Cut files" columns={3} empty={rows.length === 0 ? nothingYet : undefined}>
  …
</Table>`;
</script>

<svelte:head><title>Patterns — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Patterns"
  title="How the pieces go together."
  description="The compositions worth copying: the editor shell, the responsive navigation swap, and the states a data view has to cover."
  headingLevel={1}
/>

<Section title="The editor shell" headingLevel={2}>
  <p class="docs-note">
    Top bar, context bar, and a three-column workspace. The columns follow the panes that are
    actually rendered, so the same component serves a one-, two-, or three-column tool.
  </p>
  <div class="ldt-cluster" style="margin-bottom:0.75rem">
    <Switch bind:checked={sidebarOpen}>Show configuration</Switch>
  </div>
  <div class="docs-frame docs-frame--tall">
    <Topbar navLabel="Editor">
      {#snippet brand()}<Brand name="Topo Studio" meta="Project 04" />{/snippet}
      {#snippet navigation()}
        <Button variant="ghost" size="sm">Design</Button>
        <Button variant="ghost" size="sm">Layers</Button>
      {/snippet}
      {#snippet actions()}<Button variant="primary" size="sm">Export</Button>{/snippet}
    </Topbar>
    <ContextBar section="Terrain" title="Crater Lake" detail="Real-data preview ready" />
    <Workspace {sidebarOpen}>
      {#snippet sidebar()}
        <Sidebar label="Configuration">
          <p class="ldt-eyebrow">Configuration</p>
          <div class="ldt-stack">
            <Field label="Layers">
              {#snippet children({ id })}
                <NumberField {id} bind:value={layers} min={1} max={40} label="Layers" />
              {/snippet}
            </Field>
            <Switch bind:checked={guides}>Contour guides</Switch>
            <Select
              label="Export format"
              bind:value={format}
              boxed
              options={[
                { value: 'svg', label: 'SVG vector' },
                { value: 'pdf', label: 'PDF document' },
              ]}
            />
          </div>
        </Sidebar>
      {/snippet}
      <div class="docs-canvas">
        <div class="docs-artboard">
          <span class="ldt-eyebrow">Preview</span>
          <strong>Crater Lake</strong>
          <p>{layers} layers · {format.toUpperCase()}</p>
          <Badge variant={guides ? 'success' : 'warning'}
            >{guides ? 'Guides on' : 'Guides off'}</Badge
          >
        </div>
      </div>
    </Workspace>
  </div>
  <CodeBlock code={collapse} />
</Section>

<Section title="Narrow viewports" headingLevel={2}>
  <p class="docs-note">
    Below the <code>compact</code> breakpoint a navigation column has nowhere to sit. Swap it for a
    <code>Drawer</code>: same content, modal presentation, focus trapped while it is open. This site
    does exactly that — narrow the window and the component list moves behind
    <em>Browse</em>.
  </p>
  <Demo label="The drawer that replaces the column">
    <Drawer title="Navigation" description="Everything in this project">
      {#snippet trigger()}Open navigation{/snippet}
      <nav class="ldt-stack" style="--ldt-gap: 0.5rem">
        <a href={`${base}/`}>Overview</a>
        <a href={`${base}/foundations`}>Foundations</a>
        <a href={`${base}/components`}>Components</a>
      </nav>
    </Drawer>
  </Demo>
  <CodeBlock code={responsive} />
</Section>

<Section title="Data states" headingLevel={2}>
  <p class="docs-note">
    A list has four states, not one: loading, empty, populated, and error. <code>Skeleton</code>
    covers the first, <code>EmptyState</code> the second, and <code>Alert</code> the last. The table cannot
    count your rows, so decide the empty case where the data is.
  </p>
  <CodeBlock code={emptyTable} />
</Section>
