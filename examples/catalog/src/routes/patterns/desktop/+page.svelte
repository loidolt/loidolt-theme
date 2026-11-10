<script lang="ts">
  import { Badge, PageHeader, Section, Table, TableHeader } from '@loidolt/theme-svelte';
  import { isTauri, tauriPlatform } from '@loidolt/theme-tauri';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import Demo from '$lib/components/Demo.svelte';

  /*
   * Unlike the Capacitor page, this one imports the package for real: @loidolt/theme-tauri reads
   * the globals a Tauri window injects and never loads the Tauri runtime, so it is as safe in a
   * static docs site as in an app's server bundle. Here it reports a browser, as it should.
   */

  /*
   * Assembled from two pieces on purpose: a closing script tag written literally anywhere in
   * here — string, comment, or code — ends this component's own script block.
   */
  const endScript = `</${'script'}>`;

  const install = `npm install @loidolt/theme-tauri

# optional: the platform from Rust instead of the user agent
npm install @tauri-apps/plugin-os`;

  const stylesheet = `/* after the theme's own stylesheet */
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-tauri/styles.css';`;

  const layout = `<script lang="ts">
  import * as os from '@tauri-apps/plugin-os';
  import { setupTauri } from '@loidolt/theme-tauri';

  const desktop = setupTauri({ plugins: { os } });
  // desktop.platform: 'macos', 'windows', 'linux', … or null in a browser

  let { children } = $props();
${endScript}

{@render children()}`;

  const exports = [
    ['setupTauri', 'Every adapter in one call; returns platform, ready and destroy()'],
    ['isTauri', 'Whether the page runs in a Tauri 2 window, without loading the Tauri runtime'],
    ['tauriPlatform', "'macos', 'windows', 'linux', 'ios', 'android' or null"],
    ['markTauriPlatform', 'data-tauri-platform on <html>, for platform-specific CSS'],
  ] as const;

  const inTauri = isTauri();
  const platform = tauriPlatform();
</script>

<svelte:head><title>Desktop apps — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Patterns"
  title="Desktop apps with Tauri."
  description="@loidolt/theme-tauri carries the theme into Tauri 2 windows: it knows which OS it runs on and gives the app's chrome desktop manners. Inert in a browser, so one root layout ships everywhere."
  headingLevel={1}
/>

<Section title="Install" headingLevel={2}>
  <p class="docs-note">
    <code>@tauri-apps/api</code> 2 and the Tauri plugins are optional peer dependencies. Modules are passed
    in, never imported by the package: install only the ones you want, and each adapter turns on when
    you hand it its module.
  </p>
  <CodeBlock code={install} />
</Section>

<Section title="Set up" headingLevel={2}>
  <p class="docs-note">
    <strong>1. The stylesheet,</strong> after the theme's own. Every rule keys to
    <code>data-tauri-platform</code>, so it does nothing in a browser.
  </p>
  <CodeBlock code={stylesheet} />
  <p class="docs-note">
    <strong>2. One call in the root layout.</strong> <code>setupTauri</code> marks
    <code>&lt;html&gt;</code> with the platform and wires every adapter whose module it is given. In a
    browser or on the server it does nothing.
  </p>
  <CodeBlock code={layout} />
</Section>

<Section title="Where it runs" headingLevel={2}>
  <p class="docs-note">
    The same checks, run on this page. In a browser both stay off; inside a Tauri window
    <code>tauriPlatform()</code> names the OS, which later adapters use for macOS-only behaviour such
    as the menu bar.
  </p>
  <Demo label="isTauri() and tauriPlatform() on this page">
    <dl class="docs-desktop-facts">
      <dt><code>isTauri()</code></dt>
      <dd><Badge variant={inTauri ? 'success' : 'default'}>{inTauri ? 'true' : 'false'}</Badge></dd>
      <dt><code>tauriPlatform()</code></dt>
      <dd><Badge>{platform ?? 'null'}</Badge></dd>
    </dl>
  </Demo>
</Section>

<Section title="Exports" headingLevel={2}>
  <Table caption="Exports of @loidolt/theme-tauri">
    <thead>
      <tr>
        <TableHeader>Export</TableHeader>
        <TableHeader>Does</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each exports as [name, does] (name)}
        <tr>
          <td><code>{name}</code></td>
          <td>{does}</td>
        </tr>
      {/each}
    </tbody>
  </Table>
  <p class="docs-note">
    The repository's <code>examples/tauri</code> is a minimal Tauri 2 app on this package, for trying
    it in a real window.
  </p>
</Section>

<style>
  .docs-desktop-facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.75rem 1.5rem;
    align-items: center;
    margin: 0;
    & dd {
      margin: 0;
    }
  }
</style>
