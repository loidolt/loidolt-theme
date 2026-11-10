<script lang="ts">
  import { base } from '$app/paths';
  import { PageHeader, Section } from '@loidolt/theme-svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import example from '$lib/examples/standalone-report.html?raw';

  const files = `node_modules/@loidolt/theme-styles/dist/standalone.css       # everything
node_modules/@loidolt/theme-styles/dist/standalone-core.css  # no media, charts, maps, prose, docs
node_modules/@loidolt/theme-styles/dist/fonts-embedded.css   # optional: Jost and Archivo inlined`;

  const generate = `from pathlib import Path

styles = Path("node_modules/@loidolt/theme-styles/dist")
css = (styles / "standalone.css").read_text(encoding="utf-8")
# Optional, about 30 kB: the brand fonts instead of the system fallback.
css = (styles / "fonts-embedded.css").read_text(encoding="utf-8") + css

template = Path("report.html").read_text(encoding="utf-8")
Path("out/report.html").write_text(
    template.replace("<style></style>", f"<style>{css}</style>"), encoding="utf-8"
)`;

  const darkMode = `<!-- Follows the reader's system setting: nothing to do. -->
<html lang="en">

<!-- Pinned, whatever the system says. -->
<html lang="en" data-theme="dark">
<html lang="en" data-theme="light">`;

  const presets = `<style>
  /* standalone.css, then the preset and its dark-auto companion */
  /* @loidolt/theme-tokens/css/presets/soft            → dist/presets/soft.css */
  /* @loidolt/theme-tokens/css/presets/soft-dark-auto  → dist/presets/soft-dark-auto.css */
</style>
<html lang="en" data-preset="soft">`;

  const groups = `/* standalone-core.css, then each extra group inside the components layer: */
@layer loidolt.components {
  /* contents of @loidolt/theme-styles/components/prose.css */
}
@layer loidolt.components {
  /* contents of @loidolt/theme-styles/components/charts.css */
}`;
</script>

<svelte:head><title>CSS only — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Patterns"
  title="The same look, without Svelte."
  description="For a page with no bundler and no JavaScript framework, such as a generated, self-contained HTML report: one stylesheet pasted into a style element, and the class names the components already render."
  headingLevel={1}
/>

<Section title="One file to inline" headingLevel={2}>
  <p class="docs-note">
    <code>@loidolt/theme-styles</code> ships a prebuilt stylesheet with every
    <code>@import</code> already resolved: the tokens, the base styles, every component group, the
    utilities, the accessibility rules and the dark theme that follows
    <code>prefers-color-scheme</code>. It refers to no other file, so it works pasted into one
    <code>&lt;style&gt;</code> element, read from disk by a script, or linked on its own.
  </p>
  <CodeBlock code={files} />
  <p class="docs-note">
    The full file is about 130 kB, <code>standalone-core.css</code> about 95 kB, both before
    compression. The cascade layers are the same as in a bundled app, so any unlayered CSS you add
    after them wins without <code>!important</code>.
  </p>
  <CodeBlock code={generate} />
</Section>

<Section title="Class names" headingLevel={2}>
  <p class="docs-note">
    Every component renders plain elements with <code>ldt-</code> classes: a block such as
    <code>ldt-card</code>, parts such as <code>ldt-card__title</code>, and modifiers such as
    <code>ldt-badge--success</code>. Write the same markup by hand and it looks the same. The
    quickest way to get it right is to open a component's page in
    <a href={`${base}/components`}>Components</a> and copy the rendered HTML from the browser's inspector,
    keeping its ARIA attributes. Static pieces (cards, stats, badges, alerts, tables, prose, page headers
    and the layout utilities) need nothing else; anything that opens, closes or moves focus needs the
    script the Svelte component would have run.
  </p>
</Section>

<Section title="Dark mode" headingLevel={2}>
  <p class="docs-note">
    The standalone file follows the reader's system setting. Set <code>data-theme</code> on
    <code>&lt;html&gt;</code> to pin either scheme instead.
  </p>
  <CodeBlock code={darkMode} />
</Section>

<Section title="Presets" headingLevel={2}>
  <p class="docs-note">
    A preset is one more self-contained file. Append it and its <code>-dark-auto</code> companion
    after the standalone CSS, then set <code>data-preset</code> on <code>&lt;html&gt;</code>. The
    resolved files live in <code>@loidolt/theme-tokens</code>; the
    <code>@loidolt/theme-styles/presets/*</code> entries only <code>@import</code> them. See
    <a href={`${base}/presets`}>Presets</a> for what each one changes.
  </p>
  <CodeBlock code={presets} />
</Section>

<Section title="Fonts" headingLevel={2}>
  <p class="docs-note">
    The standalone CSS has no <code>@font-face</code>, so it never points at a font file that is not
    there. Without the fonts, the stacks fall back to Avenir Next and Helvetica Neue where they are
    installed and to the system sans-serif elsewhere, so text renders at once and nothing waits for
    a download. To match the web UI exactly, put
    <code>fonts-embedded.css</code> in front of it: about 30 kB with both faces as base64 WOFF2, under
    the SIL Open Font License.
  </p>
</Section>

<Section title="Choosing component groups" headingLevel={2}>
  <p class="docs-note">
    To keep a page smaller, start from <code>standalone-core.css</code> and add the groups you use.
    Each file under <code>@loidolt/theme-styles/components/</code> is self-contained too; wrap it in the
    components layer so it sorts where the bundled build puts it.
  </p>
  <CodeBlock code={groups} />
</Section>

<Section title="A minimal page" headingLevel={2}>
  <p class="docs-note">
    A complete report, with the stylesheet left out. The catalog's browser tests load exactly this
    file with <code>standalone.css</code> pasted in, in both schemes.
  </p>
  <CodeBlock code={example} />
</Section>
