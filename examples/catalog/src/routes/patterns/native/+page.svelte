<script lang="ts">
  import {
    AppShell,
    Brand,
    Button,
    FloatingBar,
    IconButton,
    Input,
    PageHeader,
    Section,
    Switch,
    TabBar,
    Table,
    TableHeader,
    Topbar,
  } from '@loidolt/theme-svelte';
  import CodeBlock from '$lib/components/CodeBlock.svelte';
  import Demo from '$lib/components/Demo.svelte';

  /*
   * This page documents @loidolt/theme-capacitor without importing it: the package's runtime
   * reaches for @capacitor/core, which has no business in a static docs site. The demo feeds the
   * same `--ldt-safe-*` and `--ldt-keyboard-inset` knobs the adapters write in a native shell.
   */

  /*
   * Assembled from two pieces on purpose: a closing script tag written literally anywhere in
   * here — string, comment, or code — ends this component's own script block.
   */
  const endScript = `</${'script'}>`;

  const install = `npm install @loidolt/theme-capacitor @capacitor/core

# then whichever plugins you want adapters for
npm install @capacitor/app @capacitor/keyboard @capacitor/haptics @capacitor/preferences @capacitor/splash-screen`;

  const config = `// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';
import { withTheme } from '@loidolt/theme-capacitor/config';

export default withTheme<CapacitorConfig>({
  appId: 'space.loidolt.topostack',
  appName: 'Topostack',
  webDir: 'build',
});`;

  const viewport = `<!-- src/app.html: draw under the status bar and home indicator -->
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`;

  const stylesheet = `/* after the theme's own stylesheet */
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-capacitor/styles.css';`;

  const layout = `<script lang="ts">
  import { App } from '@capacitor/app';
  import { Haptics } from '@capacitor/haptics';
  import { Keyboard } from '@capacitor/keyboard';
  import { Preferences } from '@capacitor/preferences';
  import { SplashScreen } from '@capacitor/splash-screen';
  import { goto } from '$app/navigation';
  import { setupCapacitor } from '@loidolt/theme-capacitor';
  import { theme, toaster } from '$lib/app';

  const native = setupCapacitor({
    plugins: { App, Haptics, Keyboard, Preferences, SplashScreen },
    theme, // createTheme(): stored natively, restored before the splash lifts
    toaster, // createToaster(): status toasts buzz; use native.toaster to push
    navigate: goto, // deep links
  });

  let { children } = $props();
${endScript}

{@render children()}`;

  const tuning = `const native = setupCapacitor({
  plugins: { App, Haptics, Keyboard, Network },
  backButton: { atRoot: 'exit' }, // tune an adapter…
  haptics: false, // …or switch one off
});

// Reactive state for your own markup; undefined when its plugin is not passed.
native.keyboard?.visible;
native.network?.connected;
native.lifecycle?.active;
await native.ready; // theme restored, splash gone`;

  const plugins = [
    ['@capacitor/core', 'Status and navigation bar styling (SystemBars is bundled in core)'],
    ['@capacitor/app', 'Android back button, foreground and background, deep links, text size'],
    ['@capacitor/keyboard', 'Keyboard tracking and layout, keyboard appearance'],
    ['@capacitor/haptics', 'Haptics on controls and status toasts'],
    ['@capacitor/preferences', 'Native persistence for the theme and preset'],
    ['@capacitor/splash-screen', 'Lifting the splash once the theme and fonts are in'],
    ['@capacitor/network', 'Reactive connectivity, with offline and back-online toasts'],
    ['@capacitor/browser', 'External links in the in-app browser'],
    ['@capacitor/text-zoom', 'Following the system text size'],
    ['@capacitor/clipboard', 'Copy buttons on Android'],
    ['@capawesome/capacitor-file-picker', 'The native file picker'],
    ['@capacitor/filesystem', 'Saving files to the device'],
    ['@capacitor/status-bar', 'Only for Android apps that opt out of edge-to-edge'],
  ] as const;

  const adapters = [
    [
      'syncNativeAppearance',
      'core',
      'Bar icon styles from the surface role, the legacy Android status bar colour, and the iOS keyboard appearance',
    ],
    [
      'handleBackButton',
      'app',
      'Android back closes the top layer, then runs onBack, then goes back through history, then atRoot',
    ],
    [
      'closeTopLayer',
      '—',
      'Closes the innermost open overlay the way Escape does; returns whether something took it',
    ],
    [
      'createNativeKeyboard',
      'keyboard',
      'Reactive visible and height; data-keyboard="open", --ldt-keyboard-height and --ldt-keyboard-inset',
    ],
    [
      'createHaptics',
      'haptics',
      'impact(), selection(), notify(), and install() for delegated feedback on controls',
    ],
    [
      'withHaptics',
      'haptics',
      'Wraps a toaster so status toasts play the matching notification pattern',
    ],
    [
      'persistTheme',
      'preferences',
      'Restores and mirrors a createTheme store; ready settles once restored',
    ],
    [
      'createAppLifecycle',
      'app',
      'Reactive active; pauses playing media in the background; onPause and onResume',
    ],
    ['handleDeepLinks', 'app', 'Universal links, app links and custom schemes into the app router'],
    [
      'createNetworkStatus',
      'network',
      'Reactive connected and type; optional offline and back-online toasts',
    ],
    [
      'openExternalLinks',
      'browser',
      'Other-origin links open in the in-app browser with a themed toolbar',
    ],
    [
      'hideSplashScreen',
      'splash-screen',
      'Lifts the splash after until, the fonts and a painted frame; no fade under reduced motion',
    ],
    [
      'followSystemTextSize',
      'text-zoom',
      'Applies Dynamic Type or the Android font scale, and re-reads it on resume',
    ],
    [
      'bridgeClipboard',
      'clipboard',
      'Routes navigator.clipboard.writeText through the Clipboard plugin',
    ],
    [
      'createFiles',
      'file-picker, filesystem',
      'pick() resolves Files from the native picker or a file input; save() writes to Documents or downloads',
    ],
    [
      'markNativePlatform',
      '—',
      'data-native-platform="ios" or "android" on <html>, for platform-specific CSS',
    ],
    ['nativePlatform', '—', "'ios', 'android' or null"],
  ] as const;

  const knobs = `/* What @loidolt/theme-capacitor/styles.css feeds, all at zero specificity */
:where(:root) {
  --ldt-safe-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px));
  --ldt-safe-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
  /* …right and left the same way */
}
:where(:root[data-keyboard='open']) {
  --ldt-safe-bottom: var(--ldt-keyboard-inset, 0px);
}
:where([data-keyboard='open'] .ldt-tab-bar) {
  display: none;
}`;

  const filesCode = `import { FilePicker } from '@capawesome/capacitor-file-picker';
import { Filesystem } from '@capacitor/filesystem';

const native = setupCapacitor({ plugins: { FilePicker, Filesystem /* … */ } });

// The native picker in the app, a file input in the browser: File[] either way.
const files = await native.files!.pick({ accept: '.pdf,application/pdf', multiple: true });

// Documents on the device, a download in the browser.
const saved = await native.files!.save(new File([bytes], 'export.pdf'), { folder: 'Exports' });
if (saved.method === 'filesystem') console.log(saved.uri);`;

  const fileSteps = [
    [
      'pick()',
      'The system file picker; accept is mapped to MIME types',
      'A hidden file input with the same accept and multiple',
    ],
    [
      'save()',
      'Filesystem writes to Documents (iOS: the app’s folder in Files; Android: shared Documents)',
      'A download',
    ],
    ['Dismissed', 'pick() resolves []', 'pick() resolves [] on the input’s cancel event'],
  ] as const;

  /*
   * The demo device. Insets match a current iPhone in portrait; the keyboard is drawn over the
   * page, as with Capacitor's `none` resize mode, which is the one where the inset matters.
   */
  const SAFE_TOP = 47;
  const SAFE_BOTTOM = 34;
  const KEYBOARD = 216;

  let insets = $state(true);
  let keyboard = $state(false);
  let note = $state('');

  const deviceStyle = $derived(
    [
      `--ldt-safe-top: ${insets ? SAFE_TOP : 0}px`,
      `--ldt-safe-bottom: ${insets ? SAFE_BOTTOM : 0}px`,
      '--ldt-safe-left: 0px',
      '--ldt-safe-right: 0px',
      `--ldt-keyboard-height: ${keyboard ? KEYBOARD : 0}px`,
      `--ldt-keyboard-inset: ${keyboard ? KEYBOARD : 0}px`,
      `--demo-status-bar: ${SAFE_TOP}px`,
      `--demo-home-indicator: ${SAFE_BOTTOM}px`,
    ].join('; ')
  );

  const keyRows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
</script>

<svelte:head><title>Native apps — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Patterns"
  title="Native apps with Capacitor."
  description="@loidolt/theme-capacitor carries the theme into iOS and Android shells: system bars that follow the surface, safe areas on every web view, a back button that closes what is open, and a keyboard the layout makes room for. Inert on the web, so one root layout ships everywhere."
  headingLevel={1}
/>

<Section title="Install" headingLevel={2}>
  <p class="docs-note">
    <code>@capacitor/core</code> 8 is a peer dependency. Plugins are passed in, never imported by the
    package: install only the ones you want, and each adapter turns on when you hand it its plugin.
  </p>
  <CodeBlock code={install} />
  <Table caption="Plugins and what they turn on">
    <thead>
      <tr>
        <TableHeader>Plugin</TableHeader>
        <TableHeader>Turns on</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each plugins as [plugin, does] (plugin)}
        <tr>
          <td><code>{plugin}</code></td>
          <td>{does}</td>
        </tr>
      {/each}
    </tbody>
  </Table>
</Section>

<Section title="Set up" headingLevel={2}>
  <p class="docs-note">
    <strong>1. The Capacitor config.</strong> <code>withTheme</code> paints the launch background in
    the theme's colour so there is no white flash, turns the safe-area variables on, and holds the
    splash screen until the theme is in. Everything you set wins over its defaults, down to single
    plugin options; <code>withTheme(config, &#123; scheme: 'dark' &#125;)</code> paints the launch dark.
  </p>
  <CodeBlock code={config} />
  <p class="docs-note">
    <strong>2. The viewport and the stylesheet.</strong> <code>viewport-fit=cover</code> lets the page
    draw under the bars; the stylesheet then tells the theme how far they reach. Import it after the theme's
    own.
  </p>
  <CodeBlock code={viewport} />
  <CodeBlock code={stylesheet} />
  <p class="docs-note">
    <strong>3. One call in the root layout.</strong> <code>setupCapacitor</code> wires every adapter whose
    plugin it is given, and does nothing in a browser or on the server.
  </p>
  <CodeBlock code={layout} />
  <p class="docs-note">
    Any adapter can be switched off or tuned, and the store it returns exposes the reactive state
    for your own markup.
  </p>
  <CodeBlock code={tuning} />
</Section>

<Section title="Safe areas and the keyboard" headingLevel={2}>
  <p class="docs-note">
    <code>Topbar</code>, <code>AppShell</code>, <code>TabBar</code>, <code>Drawer</code>, toasts and
    floating bars already pad themselves by the <code>--ldt-safe-*</code> knobs, which fall back to
    <code>env(safe-area-inset-*)</code>. Android web views before Chromium 140 report that as 0, so
    the stylesheet feeds the knobs from the values Capacitor injects instead. While the keyboard
    overlays the page, the bottom inset becomes <code>--ldt-keyboard-inset</code> and the tab bar steps
    aside.
  </p>
  <Demo label="Insets previewed by setting the knobs on a framed shell">
    <div class="ldt-cluster docs-native-controls">
      <Switch bind:checked={insets}>Feed safe-area insets</Switch>
      <Switch bind:checked={keyboard}>Keyboard open</Switch>
    </div>
    <div class="docs-native-device" style={deviceStyle}>
      <div class="docs-native-screen" data-keyboard={keyboard ? 'open' : undefined}>
        <AppShell mainId="native-demo-main" embedded>
          {#snippet header()}
            <Topbar navLabel="Demo app">
              {#snippet brand()}<Brand name="Topostack" meta="Field" />{/snippet}
              {#snippet actions()}<Button size="sm" variant="primary">Sync</Button>{/snippet}
            </Topbar>
          {/snippet}
          <div class="docs-native-stage docs-canvas">
            <div class="docs-native-field">
              <Input
                boxed
                aria-label="Add a field note"
                placeholder="Add a field note"
                bind:value={note}
              />
            </div>
            <FloatingBar label="Zoom" placement="bottom-end">
              <IconButton label="Zoom in" size="sm">+</IconButton>
              <IconButton label="Zoom out" size="sm">−</IconButton>
            </FloatingBar>
          </div>
          {#snippet tabBar()}
            <TabBar
              label="Demo app"
              items={[
                { label: 'Map', href: '#native-demo-main', icon: mapIcon, current: true },
                { label: 'Log', href: '#native-demo-main', icon: logIcon },
                { label: 'Settings', href: '#native-demo-main', icon: settingsIcon },
              ]}
            />
          {/snippet}
        </AppShell>

        <!-- The device itself: decoration over the page, as the real bars are. -->
        <div class="docs-native-status" aria-hidden="true">
          <span>9:41</span><span class="docs-native-notch"></span><span>5G</span>
        </div>
        {#if keyboard}
          <div class="docs-native-keyboard" aria-hidden="true">
            {#each keyRows as row (row)}
              <div class="docs-native-keys">
                {#each row as key (key)}<span>{key}</span>{/each}
              </div>
            {/each}
          </div>
        {/if}
        <div class="docs-native-home" aria-hidden="true"></div>
      </div>
    </div>
  </Demo>
  <p class="docs-note">
    Turn the insets off to see an Android web view without the stylesheet: the brand slides under
    the status bar and the tab labels under the home indicator. With the keyboard open, the zoom
    controls lift above it and the tab bar is gone until it closes. With Capacitor's default
    <code>native</code> resize mode the web view shrinks instead, the inset stays 0, and nothing needs
    to move.
  </p>
  <CodeBlock code={knobs} />
</Section>

<Section title="Files" headingLevel={2}>
  <p class="docs-note">
    <code>native.files</code> is there with or without plugins. With <code>FilePicker</code> from
    <code>@capawesome/capacitor-file-picker</code> and <code>Filesystem</code> it uses the system
    picker and saves to the device; in a browser it opens a file input and downloads. Picked files
    are
    <code>File</code> objects either way, the same ones a <code>FileInput</code> hands you, so one upload
    path serves both.
  </p>
  <Table caption="What pick() and save() do in an app and in a browser">
    <thead>
      <tr>
        <TableHeader>Call</TableHeader>
        <TableHeader>In an app</TableHeader>
        <TableHeader>In a browser</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each fileSteps as [call, app, browser] (call)}
        <tr>
          <td><code>{call}</code></td>
          <td>{app}</td>
          <td>{browser}</td>
        </tr>
      {/each}
    </tbody>
  </Table>
  <CodeBlock code={filesCode} />
  <p class="docs-note">
    Saving needs storage access only on Android 10 and older; <code>save</code> asks for it and
    rejects with <code>FilePermissionError</code> if the user refuses. On iOS the saved files appear
    in the Files app once <code>Info.plist</code> sets <code>UIFileSharingEnabled</code> and
    <code>LSSupportsOpeningDocumentsInPlace</code>.
  </p>
</Section>

<Section title="Adapters" headingLevel={2}>
  <p class="docs-note">
    <code>setupCapacitor</code> is these, wired together. Each is exported on its own for apps that
    want only one or wire them differently; every one returns a teardown (or a store with
    <code>destroy()</code>) and is a no-op outside a native shell.
  </p>
  <Table caption="Adapters exported by @loidolt/theme-capacitor">
    <thead>
      <tr>
        <TableHeader>Export</TableHeader>
        <TableHeader>Plugin</TableHeader>
        <TableHeader>Does</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each adapters as [name, plugin, does] (name)}
        <tr>
          <td><code>{name}</code></td>
          <td
            >{#if plugin === '—'}—{:else}<code>{plugin}</code>{/if}</td
          >
          <td>{does}</td>
        </tr>
      {/each}
    </tbody>
  </Table>
  <p class="docs-note">
    The back button sends Escape from the focused element, which every overlay in
    <code>@loidolt/theme-svelte</code> already closes on; a layer that refuses Escape also stops the
    back press. Haptics tick on switches, checkboxes, radios, tabs, toggles, options and tab bar
    links — plain buttons opt in with <code>data-haptic</code>.
  </p>
</Section>

{#snippet mapIcon()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14" /></svg
  >{/snippet}
{#snippet logIcon()}<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
    ><path d="M6 4h12v16H6zM9 9h6M9 13h6M9 17h3" /></svg
  >{/snippet}
{#snippet settingsIcon()}<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    ><circle cx="12" cy="12" r="3" /><path
      d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
    /></svg
  >{/snippet}

<style>
  .docs-native-controls {
    margin-bottom: 1rem;
  }
  .docs-native-device {
    width: min(100%, 22rem);
    margin-inline: auto;
    padding: 0.6rem;
    border-radius: 2.6rem;
    background: #16191b; /* @literal device bezel, the same in both schemes */
  }
  .docs-native-screen {
    position: relative;
    height: 38rem;
    overflow: hidden;
    border-radius: 2rem;
    background: var(--loidolt-background);
    /* Mirrors styles.css, scoped here because `data-keyboard` sits on this element, not <html>. */
    &[data-keyboard='open'] {
      --ldt-safe-bottom: var(--ldt-keyboard-inset, 0px);
    }
    &[data-keyboard='open'] :global(.ldt-tab-bar) {
      display: none;
    }
  }
  /* The shell fills the screen rather than the browser window around it. */
  .docs-native-screen :global(.ldt-app-shell) {
    height: 100%;
    min-height: 0;
  }
  .docs-native-screen :global(.ldt-topbar) {
    position: static;
  }
  .docs-native-stage {
    position: relative;
    height: 100%;
    place-items: start stretch;
  }
  .docs-native-field {
    padding: 1rem;
  }

  .docs-native-status,
  .docs-native-home,
  .docs-native-keyboard {
    position: absolute;
    inset-inline: 0;
    /* Above the shell's sticky rows, as the real bars are above the web view. */
    z-index: calc(var(--loidolt-z-sticky) + 1);
    pointer-events: none;
  }
  .docs-native-status {
    top: 0;
    height: var(--demo-status-bar);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-inline: 1.6rem;
    color: var(--loidolt-text);
    font: 600 var(--loidolt-font-size-xs) var(--loidolt-font-utility);
  }
  .docs-native-notch {
    width: 6.5rem;
    height: 1.9rem;
    border-radius: 1rem;
    background: #000;
  }
  .docs-native-home {
    bottom: 0;
    height: var(--demo-home-indicator);
    display: grid;
    place-items: center;
    z-index: calc(var(--loidolt-z-sticky) + 2);
    &::after {
      content: '';
      width: 8rem;
      height: 0.3rem;
      border-radius: 1rem;
      background: var(--loidolt-text);
    }
  }
  .docs-native-keyboard {
    bottom: 0;
    height: var(--ldt-keyboard-height);
    display: grid;
    align-content: start;
    gap: 0.5rem;
    padding: 0.6rem 0.25rem;
    background: var(--loidolt-surface-sunken);
    border-top: var(--loidolt-border-width) solid var(--loidolt-border);
  }
  .docs-native-keys {
    display: flex;
    justify-content: center;
    gap: 0.3rem;
    & span {
      flex: 0 1 2rem;
      height: 2.4rem;
      display: grid;
      place-items: center;
      border-radius: 0.3rem;
      background: var(--loidolt-surface);
      color: var(--loidolt-text);
      font: var(--loidolt-font-size-sm) var(--loidolt-font-utility);
    }
  }
</style>
