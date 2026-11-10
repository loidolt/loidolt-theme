<script lang="ts">
  import { defaultWindowIcon } from '@tauri-apps/api/app';
  import * as event from '@tauri-apps/api/event';
  import * as menu from '@tauri-apps/api/menu';
  import * as tray from '@tauri-apps/api/tray';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import * as deepLink from '@tauri-apps/plugin-deep-link';
  import * as os from '@tauri-apps/plugin-os';
  import {
    AppShell,
    Badge,
    Brand,
    Button,
    createTheme,
    PageHeader,
    Section,
    ThemeToggle,
    Topbar,
  } from '@loidolt/theme-svelte';
  import {
    isTauri,
    setupTauri,
    type SecondInstance,
    type TrayMenuItem,
  } from '@loidolt/theme-tauri';

  const theme = createTheme();

  let launch = $state<SecondInstance | null>(null);
  let link = $state<string | null>(null);
  let watching = $state(true);

  async function showWindow() {
    const window = getCurrentWindow();
    await window.unminimize();
    await window.show();
    await window.setFocus();
  }

  const trayItems = (): TrayMenuItem[] => [
    { id: 'show', label: 'Show window', action: showWindow },
    { id: 'watch', label: watching ? 'Pause watching' : 'Resume watching', action: toggleWatching },
    'separator',
    'quit',
  ];

  // In a browser (`npm run dev`) this is inert: platform is null, <html> is left alone and
  // there is no tray.
  const desktop = setupTauri({
    plugins: { os, event, deepLink, tray, menu },
    singleInstance: { onSecondInstance: (next) => (launch = next) },
    deepLinks: { onUrl: (url) => (link = url) },
    tray: {
      icon: isTauri() ? defaultWindowIcon() : null,
      tooltip: 'Watching for new files',
      items: trayItems(),
      onClick: showWindow,
    },
  });

  function toggleWatching() {
    watching = !watching;
    desktop.tray?.update({
      tooltip: watching ? 'Watching for new files' : 'Paused',
      items: trayItems(),
    });
  }

  const names = {
    macos: 'macOS',
    windows: 'Windows',
    linux: 'Linux',
    ios: 'iOS',
    android: 'Android',
  } as const;
  const where = desktop.platform ? `A Tauri window on ${names[desktop.platform]}` : 'A browser';

  let count = $state(0);
</script>

<AppShell mainId="main">
  {#snippet header()}
    <Topbar navLabel="Example app">
      {#snippet brand()}<Brand name="Theme example" meta="Desktop" />{/snippet}
      {#snippet actions()}<ThemeToggle {theme} />{/snippet}
    </Topbar>
  {/snippet}
  <div class="ldt-stack example-page">
    <PageHeader
      eyebrow="@loidolt/theme-tauri"
      title="One layout, browser and window."
      description="The same root layout runs in a browser and in a Tauri window; the desktop adapters only switch on inside the window."
      headingLevel={1}
    />
    <Section title="Running in" headingLevel={2}>
      <p>
        <Badge variant={desktop.platform ? 'success' : 'default'}>{where}</Badge>
      </p>
      <p>
        Inside a window, <code>&lt;html&gt;</code> carries
        <code>data-tauri-platform</code>, and button labels like the one below stop being
        selectable, as in a native app.
      </p>
      <Button variant="primary" onclick={() => count++}>Clicked {count} times</Button>
    </Section>
    <Section title="In the background" headingLevel={2}>
      <p>
        The tray icon stays while the app runs; a left click brings this window back, and its menu
        pauses and resumes. <Badge variant={watching ? 'success' : 'default'}>
          {watching ? 'Watching' : 'Paused'}
        </Badge>
      </p>
      <Button onclick={toggleWatching}>{watching ? 'Pause watching' : 'Resume watching'}</Button>
      <p>
        Launch the app again, with a file path after it, and this window comes forward instead of a
        second one opening:
      </p>
      <p>
        {#if launch}
          Second launch with {launch.files.length === 1
            ? '1 file'
            : `${launch.files.length} files`}{launch.files.length
            ? `: ${launch.files.join(', ')}`
            : ''}.
        {:else}
          No second launch yet.
        {/if}
      </p>
      <p>
        Open <code>theme-example://projects/42</code> from a browser (in a bundled build) to deep
        link here:
        {link ? link : 'no link yet.'}
      </p>
    </Section>
  </div>
</AppShell>

<style>
  .example-page {
    padding: var(--loidolt-space-6);
  }
</style>
