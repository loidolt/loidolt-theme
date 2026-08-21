<script lang="ts">
  import { base } from '$app/paths';
  import * as theme from '@loidolt/theme-svelte';
  import { Alert, Card, PageHeader, Section } from '@loidolt/theme-svelte';
  import { entries, grouped } from '$lib/registry.js';

  /*
   * The registry is hand-written; the barrel is the truth. Anything exported but undocumented
   * is reported here rather than silently missing, which is what keeps the two in step.
   */
  const exported = Object.keys(theme).filter(
    (name) => /^[A-Z]/.test(name) && !name.endsWith('Primitive')
  );
  const documented = new Set(entries.map((entry) => entry.name));
  const undocumented = exported.filter((name) => !documented.has(name));
</script>

<svelte:head><title>Components — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Reference"
  title="Components"
  description={`${exported.length} components, grouped by the job they do. Every page carries a live example, the accessibility contract, and a prop table generated from source.`}
  headingLevel={1}
/>

{#if undocumented.length > 0}
  <Alert title="Undocumented exports" variant="warning">
    {undocumented.join(', ')} — add an entry to <code>src/lib/registry.ts</code>.
  </Alert>
{/if}

{#each grouped as section (section.group)}
  <Section title={section.group} headingLevel={2} id={section.group.toLowerCase()}>
    <div class="ldt-grid" style="--ldt-min: 18rem">
      {#each section.items as item (item.slug)}
        <a class="docs-card-link" href={`${base}/components/${item.slug}`}>
          <Card title={item.name} headingLevel={3}>{item.summary}</Card>
        </a>
      {/each}
    </div>
  </Section>
{/each}
