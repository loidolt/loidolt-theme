<script lang="ts">
  import type { Component } from 'svelte';
  import { base } from '$app/paths';
  import { Alert, Breadcrumbs, PageHeader, Section } from '@loidolt/theme-svelte';
  import Demo from '$lib/components/Demo.svelte';
  import PropsTable from '$lib/components/PropsTable.svelte';
  import RichText from '$lib/components/RichText.svelte';

  let { data } = $props();

  /*
   * Eager glob rather than a dynamic import: the site is prerendered to static files, and a
   * demo that fails to resolve should break the build, not the page.
   */
  const modules = import.meta.glob<{ default: Component }>('$lib/demos/*.svelte', {
    eager: true,
  });

  const demo = $derived(
    modules[`/src/lib/demos/${data.entry.name}.svelte`]?.default as Component | undefined
  );
</script>

<svelte:head><title>{data.entry.name} — Loidolt Theme</title></svelte:head>

<Breadcrumbs
  items={[
    { label: 'Components', href: `${base}/components` },
    { label: data.entry.group, href: `${base}/components#${data.entry.group.toLowerCase()}` },
    { label: data.entry.name },
  ]}
/>

<PageHeader
  eyebrow="Component"
  title={data.entry.name}
  description={data.entry.summary}
  headingLevel={1}
/>

<Section title="Example" headingLevel={2}>
  {#if demo}
    {@const Example = demo}
    <Demo><Example /></Demo>
  {:else}
    <Alert title="No example yet" variant="warning">
      Add <code>src/lib/demos/{data.entry.name}.svelte</code> to document this component.
    </Alert>
  {/if}
</Section>

{#if data.entry.notes?.length}
  <Section title="Notes" headingLevel={2}>
    <ul class="docs-notes">
      {#each data.entry.notes as note (note)}<li><RichText value={note} /></li>{/each}
    </ul>
  </Section>
{/if}

<Section title="Props" headingLevel={2}>
  <p class="docs-note">
    Generated from the component source, so it cannot drift from the implementation.
  </p>
  <PropsTable name={data.entry.name} />
</Section>
