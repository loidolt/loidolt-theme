<script lang="ts">
  import { Badge, PageHeader, Section, Table, TableHeader } from '@loidolt/theme-svelte';
  import { isTauri, tauriPlatform, windowBackground } from '@loidolt/theme-tauri';
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

# the window chrome adapters take the window from @tauri-apps/api
npm install @tauri-apps/api

# optional: the platform from Rust instead of the user agent
npm install @tauri-apps/plugin-os`;

  const stylesheet = `/* after the theme's own stylesheet */
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-tauri/styles.css';`;

  const layout = `<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import * as os from '@tauri-apps/plugin-os';
  import { setupTauri } from '@loidolt/theme-tauri';
  import { theme } from '$lib/theme'; // the app's createTheme()

  const desktop = setupTauri({ plugins: { os, window: getCurrentWindow }, theme });
  // desktop.platform: 'macos', 'windows', 'linux', … or null in a browser

  let { children } = $props();
${endScript}

{@render children()}`;

  const light = windowBackground('light');
  const dark = windowBackground('dark');

  const windowConfig = `// src-tauri/tauri.conf.json, in app.windows[0]
{
  "visible": false,
  "backgroundColor": "${light}",
  "titleBarStyle": "Overlay",
  "hiddenTitle": true
}`;

  const capability = `// src-tauri/capabilities/default.json
{
  "permissions": [
    "core:default",
    "core:window:allow-set-background-color",
    "core:window:allow-set-theme",
    "core:window:allow-show",
    "core:window:allow-start-dragging"
  ]
}`;

  const chrome = `<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import { Topbar } from '@loidolt/theme-svelte';
  import { setupTauri } from '@loidolt/theme-tauri';
  import { theme } from '$lib/theme';

  const desktop = setupTauri({
    plugins: { window: getCurrentWindow },
    theme,
    chrome: { titleBar: 'overlay' },
  });
${endScript}

<Topbar dragRegion>…</Topbar>`;

  const exports = [
    ['setupTauri', 'Every adapter in one call; returns platform, ready and destroy()'],
    ['isTauri', 'Whether the page runs in a Tauri 2 window, without loading the Tauri runtime'],
    ['tauriPlatform', "'macos', 'windows', 'linux', 'ios', 'android' or null"],
    ['markTauriPlatform', 'data-tauri-platform on <html>, for platform-specific CSS'],
    [
      'syncWindowAppearance',
      'The window background in the live page colour, and with the theme, its light or dark appearance',
    ],
    [
      'insetWindowChrome',
      'Insets the page clear of the macOS window buttons under an overlay title bar',
    ],
    ['showWindow', 'Shows a window that starts hidden once the theme and fonts are in'],
    ['windowBackground', "The theme's launch colour, for backgroundColor in tauri.conf.json"],
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

<Section title="Window chrome" headingLevel={2}>
  <p class="docs-note">
    Pass the window, <code>getCurrentWindow</code> uncalled (it throws in a browser, so
    <code>setupTauri</code> calls it only inside a window), and the app's <code>createTheme</code>
    store, and the window follows the page: its background is the live page colour, through every theme
    and preset change, and its native appearance (menus, dialogs, scroll bars) takes an explicit light
    or dark choice, handing back to the OS for <code>system</code>.
  </p>
  <p class="docs-note">
    <strong>No white flash.</strong> Start the window hidden and give it the theme's launch colour;
    <code>setupTauri</code> shows it once the window has its colours and the fonts are in, and
    <code>desktop.ready</code> settles after that. The launch colour is
    <code>{light}</code> for a light-first app and <code>{dark}</code> for a dark one, from
    <code>windowBackground()</code>.
  </p>
  <CodeBlock code={windowConfig} />
  <p class="docs-note">
    <strong>The overlay title bar</strong> (<code>titleBarStyle</code> and <code>hiddenTitle</code>
    above) draws the page right up to the top edge on macOS. With
    <code>chrome: &#123; titleBar: 'overlay' &#125;</code>
    the page clears the window buttons: <code>--ldt-safe-top</code> reserves a 28px strip for them,
    which <code>Topbar</code> grows by, and full screen, where they hide, gets the room back.
    <code>trafficLights: 'beside'</code>
    puts them in the bar's own row instead, inset from the left through
    <code>--ldt-safe-left</code>; <code>top</code> and <code>left</code> change the room. Windows and
    Linux keep their native title bar, untouched.
  </p>
  <p class="docs-note">
    <strong>Dragging.</strong> <code>&lt;Topbar dragRegion&gt;</code> lets the bar move the window, as
    a title bar would; its buttons, links and fields stay clickable. Each window call needs its permission
    in the capability file.
  </p>
  <CodeBlock code={chrome} />
  <CodeBlock code={capability} />
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
