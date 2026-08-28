<script lang="ts">
  import { base } from '$app/paths';
  import * as theme from '@loidolt/theme-svelte';
  import { Badge, Button, Card, Section } from '@loidolt/theme-svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';

  /*
   * Assembled from two pieces on purpose: a closing script tag written literally anywhere in
   * here — string, comment, or code — ends this component's own script block.
   */
  const endScript = `</${'script'}>`;

  const componentCount = Object.keys(theme).filter(
    (name) => /^[A-Z]/.test(name) && !name.endsWith('Primitive')
  ).length;

  const install = `npm install @loidolt/theme-svelte

/* app.css — once, before your own styles */
@import '@loidolt/theme-svelte/styles.css';`;

  const usage = `<script lang="ts">
  import { Button, Field, Input } from '@loidolt/theme-svelte';
  let name = $state('');
${endScript}

<Field label="Project name">
  {#snippet children({ id, describedBy, invalid })}
    <Input {id} bind:value={name} aria-describedby={describedBy} aria-invalid={invalid} boxed />
  {/snippet}
</Field>
<Button variant="primary">Create project</Button>`;
</script>

<svelte:head><title>Loidolt Theme — Svelte design system</title></svelte:head>

<section class="docs-hero">
  <div>
    <p class="ldt-eyebrow">Loidolt design system</p>
    <h1>Useful tools, <span>quietly exact.</span></h1>
    <p class="docs-lede">
      A Svelte-first component library for dense creative tools and clean everyday applications.
      Warm surfaces, sharp edges, clear hierarchy, and no Tailwind contract.
    </p>
    <div class="ldt-cluster">
      <Button variant="primary" href={`${base}/components`}>Browse components</Button>
      <Button variant="quiet" href={`${base}/foundations`}>Foundations</Button>
      <Button variant="text" href={`${base}/patterns`}>Patterns</Button>
    </div>
  </div>
  <div class="docs-stats" aria-label="Library facts">
    <div class="docs-stat"><strong>{componentCount}</strong><span>Components</span></div>
    <div class="docs-stat"><strong>3</strong><span>Packages</span></div>
    <div class="docs-stat"><strong>AA</strong><span>Contrast target</span></div>
    <div class="docs-stat"><strong>0</strong><span>Runtime CSS deps</span></div>
  </div>
</section>

<Section title="Install" headingLevel={2}>
  <CodeBlock code={install} />
  <CodeBlock code={usage} />
</Section>

<Section title="What the packages are" headingLevel={2}>
  <div class="ldt-grid" style="--ldt-min: 18rem">
    <Card title="@loidolt/theme-tokens" headingLevel={3}>
      Typed colour, type, spacing, sizing, shadow, z-index, motion, and breakpoint values, plus the
      generated CSS custom properties and a tested dark theme.
    </Card>
    <Card title="@loidolt/theme-styles" headingLevel={3}>
      Bundled fonts, the base layer, accessibility helpers, component classes, and layout utilities
      — usable on their own from plain HTML.
    </Card>
    <Card title="@loidolt/theme-svelte" headingLevel={3}>
      The Svelte 5 components, the theme and media runtimes, and the toaster. Everything else comes
      with it as a dependency.
    </Card>
  </div>
</Section>

<Section title="What it commits to" headingLevel={2}>
  <div class="ldt-grid" style="--ldt-min: 18rem">
    <Card title="Server-side rendering" headingLevel={3}>
      Ids come from <code>$props.id()</code>, so server and client markup agree and hydration never
      re-labels a control. Nothing touches <code>window</code> during render, and the SSR suite renders
      every export to prove it.
    </Card>
    <Card title="Accessibility" headingLevel={3}>
      Focus, portalling, and dismissal come from Bits UI; naming, roles, and contrast are asserted
      in test. Every token pair is checked at WCAG AA, in both themes.
    </Card>
    <Card title="Cascade layers" headingLevel={3}>
      Everything ships inside <code>@layer loidolt.*</code>, so unlayered application CSS outranks
      it. Overriding the system never needs <code>!important</code>.
    </Card>
    <Card title="No framework contract" headingLevel={3}>
      No Tailwind, no icon library, no authentication, no domain code.
      <Badge variant="accent">Tailwind-free</Badge>
    </Card>
  </div>
</Section>
