<script lang="ts">
  import { Badge, Button, PageHeader, Section, Table, TableHeader } from '@loidolt/theme-svelte';
  import { breakpoints, colors, semantic, spacing, typography } from '@loidolt/theme-tokens';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import Demo from '$lib/components/Demo.svelte';

  const primitives = [
    ['Paper', colors.paper, colors.deep],
    ['Panel', colors.panel, colors.deep],
    ['Canvas', colors.canvas, colors.deep],
    ['Deep', colors.deep, colors.panel],
    ['Muted', colors.muted, colors.white],
    ['Line', colors.line, colors.deep],
    ['Orange', colors.orange, colors.white],
    ['Orange dark', colors.orangeDark, colors.white],
    ['Success', colors.success, colors.white],
    ['Warning', colors.warning, colors.white],
    ['Error', colors.error, colors.white],
    ['Info', colors.info, colors.white],
  ] as const;

  const roles = [
    ['surface', semantic.surface],
    ['surface-alt', semantic.surfaceAlt],
    ['text', semantic.text],
    ['text-muted', semantic.textMuted],
    ['border', semantic.border],
    ['border-control', semantic.borderControl],
    ['accent', semantic.accent],
    ['on-accent', semantic.onAccent],
  ] as const;

  const theming = `/* Restyle the system by redefining the semantic tier only. */
[data-theme='midnight'] {
  color-scheme: dark;
  --loidolt-surface: #10212c;
  --loidolt-text: #dceaf2;
  --loidolt-border: #29414f;
  --loidolt-accent: #e0672f;
  --loidolt-on-accent: #10212c;
}`;

  const darkMode = `@import '@loidolt/theme-styles';
@import '@loidolt/theme-styles/dark';       /* [data-theme="dark"] */
/* or */
@import '@loidolt/theme-styles/dark-auto';  /* also follows prefers-color-scheme */`;

  const runtime = `// src/lib/theme.ts
import { createTheme } from '@loidolt/theme-svelte';
export const theme = createTheme();

// src/hooks.server.ts — stops the light flash on reload
import { themeScript } from '@loidolt/theme-svelte';
export const handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%theme%', themeScript()),
  });`;

  const layers = `@layer loidolt.tokens, loidolt.reset, loidolt.base,
       loidolt.components, loidolt.utilities, loidolt.a11y;`;
</script>

<svelte:head><title>Foundations — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Foundations"
  title="Warm, technical, restrained."
  description="Primitives hold the palette; a semantic tier names the roles components actually use. Every value below is read from @loidolt/theme-tokens rather than copied."
  headingLevel={1}
/>

<Section title="Primitives" headingLevel={2}>
  <div class="docs-swatches">
    {#each primitives as [name, value, ink] (name)}
      <div class="docs-swatch" style:background={value} style:color={ink}>
        <strong>{name}</strong><span>{value}</span>
      </div>
    {/each}
  </div>
</Section>

<Section title="Semantic roles" headingLevel={2}>
  <p class="docs-note">
    The stylesheets read only this tier. Redefine a role and every component that plays it follows;
    redefine a primitive and it propagates, because roles link with <code>var()</code>
    rather than baking in a resolved value.
  </p>
  <Demo label="The same components, one wrapper with overridden roles">
    <div class="docs-theme-pair">
      <div class="docs-theme-panel">
        <span class="docs-demo__label">Default</span>
        <div class="ldt-cluster">
          <Button variant="primary">Export</Button>
          <Button variant="quiet">Cancel</Button>
          <Badge variant="accent" size="md">Live</Badge>
        </div>
      </div>
      <div
        class="docs-theme-panel ldt-theme"
        style="--loidolt-surface:#10212c; --loidolt-text:#dceaf2; --loidolt-border:#29414f; --loidolt-border-strong:#5b7f92; --loidolt-accent:#4f9ec4; --loidolt-on-accent:#0b1820; --loidolt-text-muted:#9fbccb"
      >
        <span class="docs-demo__label">Overridden</span>
        <div class="ldt-cluster">
          <Button variant="primary">Export</Button>
          <Button variant="quiet">Cancel</Button>
          <Badge variant="accent" size="md">Live</Badge>
        </div>
      </div>
    </div>
  </Demo>

  <Table caption="Semantic roles">
    <thead>
      <tr>
        <TableHeader>Role</TableHeader>
        <TableHeader>Custom property</TableHeader>
        <TableHeader>Light value</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each roles as [role, value] (role)}
        <tr>
          <td>
            <span class="docs-role-chip" style:background={`var(--loidolt-${role})`}></span>
            {role}
          </td>
          <td><code>--loidolt-{role}</code></td>
          <td><code>{value}</code></td>
        </tr>
      {/each}
    </tbody>
  </Table>

  <p class="docs-note">
    Two distinctions carry weight. <code>--loidolt-danger</code> is a <em>fill</em> with
    <code>--loidolt-on-danger</code> as the ink that sits on it, while
    <code>--loidolt-text-danger</code> is the same status used as text on a surface — a fill tuned
    for white ink is too light to read as text. And <code>--loidolt-border</code> is a decorative
    hairline, while <code>--loidolt-border-control</code> is the boundary of an input, held to 3:1 because
    that border is the only thing identifying the control.
  </p>
  <CodeBlock code={theming} />
</Section>

<Section title="Dark mode" headingLevel={2}>
  <p class="docs-note">
    A tested dark theme ships with the package — every pair is asserted at WCAG AA, including the
    <code>on-*</code> inks, so you do not have to get them right yourself.
  </p>
  <CodeBlock code={darkMode} />
  <p class="docs-note">
    The runtime that drives it is <code>createTheme()</code>, with
    <code>themeScript()</code> for the first paint. This site uses exactly this setup; the picker in
    the top bar is <code>ThemeToggle</code>.
  </p>
  <CodeBlock code={runtime} />
</Section>

<Section title="Type and space" headingLevel={2}>
  <div class="ldt-grid" style="--ldt-min: 16rem">
    <div>
      <p class="ldt-eyebrow">Type scale</p>
      <ul class="docs-scale">
        {#each Object.entries(typography.size) as [name, value] (name)}
          <li><code>{name}</code><span style:font-size={value}>Aa</span><code>{value}</code></li>
        {/each}
      </ul>
    </div>
    <div>
      <p class="ldt-eyebrow">Spacing</p>
      <ul class="docs-scale">
        {#each Object.entries(spacing) as [name, value] (name)}
          <li>
            <code>{name}</code>
            <span class="docs-space-bar" style:width={value}></span>
            <code>{value}</code>
          </li>
        {/each}
      </ul>
    </div>
    <div>
      <p class="ldt-eyebrow">Breakpoints</p>
      <ul class="docs-scale">
        {#each Object.entries(breakpoints) as [name, value] (name)}
          <li><code>{name}</code><span></span><code>{value}</code></li>
        {/each}
      </ul>
      <p class="docs-note">
        Breakpoints are not custom properties — <code>@media</code> cannot read
        <code>var()</code> — but <code>breakpointQuery()</code> turns them into queries, and
        <code>createMediaQuery()</code> makes them reactive.
      </p>
    </div>
  </div>
</Section>

<Section title="Cascade layers" headingLevel={2}>
  <CodeBlock code={layers} />
  <p class="docs-note">
    Unlayered application CSS outranks every one of these, so a plain selector in your app always
    wins — no <code>!important</code> needed. <code>loidolt.reset</code> is deliberately empty and
    reserved for an app's own reset, and <code>loidolt.a11y</code> is last so the focus ring beats component
    styles by layer order alone.
  </p>
</Section>
