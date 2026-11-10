<script lang="ts">
  import { defaultWindowIcon } from '@tauri-apps/api/app';
  import * as event from '@tauri-apps/api/event';
  import * as menu from '@tauri-apps/api/menu';
  import * as tray from '@tauri-apps/api/tray';
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import * as deepLink from '@tauri-apps/plugin-deep-link';
  import * as dialog from '@tauri-apps/plugin-dialog';
  import * as fs from '@tauri-apps/plugin-fs';
  import * as notification from '@tauri-apps/plugin-notification';
  import * as os from '@tauri-apps/plugin-os';
  import {
    AppShell,
    Badge,
    Brand,
    Button,
    Dropzone,
    createTheme,
    createToaster,
    PageHeader,
    Section,
    ThemeToggle,
    Toast,
    ToastViewport,
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
  let dropzone = $state<ReturnType<typeof Dropzone>>();
  let received = $state<string[]>([]);
  let saved = $state('');

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

  const toaster = createToaster({ duration: 6000 });

  // In a browser (`npm run dev`) this is inert: platform is null, <html> is left alone, there is
  // no tray, and notifications fall back to the Web Notifications API, or to a toast without
  // either. In a window it paints the window in the theme, insets the page under the overlay
  // title bar set up in tauri.conf.json, and shows the window, which starts hidden, once the
  // theme is in. `getCurrentWindow` goes in uncalled: it needs the Tauri runtime, and setupTauri
  // only calls it inside a window.
  const desktop = setupTauri({
    plugins: {
      os,
      notification,
      event,
      deepLink,
      tray,
      menu,
      dialog,
      fs,
      window: getCurrentWindow,
      webview: getCurrentWebview,
    },
    theme,
    chrome: { titleBar: 'overlay' },
    notifications: { toaster },
    singleInstance: { onSecondInstance: (next) => (launch = next) },
    deepLinks: { onUrl: (url) => (link = url) },
    // Files dropped on the window go into the Dropzone below, which filters them by its accept.
    fileDrop: { target: () => dropzone },
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

  async function openFiles() {
    const files = (await desktop.files?.pick({ accept: '.txt,.md,.json', multiple: true })) ?? [];
    if (files.length) dropzone?.addFiles(files);
  }

  async function saveNotes() {
    const notes = new File([`Received:\n${received.join('\n')}\n`], 'received.txt', {
      type: 'text/plain',
    });
    const outcome = await desktop.files?.save(notes);
    saved =
      outcome?.method === 'filesystem'
        ? `Saved to ${outcome.path}`
        : outcome?.method === 'download'
          ? 'Downloaded'
          : 'Not saved';
  }

  let count = $state(0);
  let sent = $state<boolean | null>(null);

  async function notifyLater() {
    // Ask on the click itself: a prompt no user gesture asked for is ignored by browsers.
    await desktop.notifications?.requestPermission();
    sent = null;
    setTimeout(async () => {
      sent =
        (await desktop.notifications?.notify({
          title: 'Export finished',
          body: 'The file is ready in your downloads.',
        })) ?? false;
    }, 3000);
  }
</script>

<AppShell mainId="main">
  {#snippet header()}
    <Topbar navLabel="Example app" dragRegion>
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
    <Section title="Window chrome" headingLevel={2}>
      <p>
        On macOS the title bar is an overlay: the top bar runs to the window's top edge, leaves a
        strip for the window buttons, and drags the window from anywhere but its controls. Switch
        the theme and the window background and appearance follow; full screen gives the strip back.
      </p>
    </Section>
    <Section title="Notifications" headingLevel={2}>
      <p>
        Permission: <Badge>{desktop.notifications?.permission ?? 'off'}</Badge>
        {#if sent !== null}
          <Badge variant={sent ? 'success' : 'warning'}
            >{sent ? 'Sent to the OS' : 'Shown as a toast'}</Badge
          >
        {/if}
      </p>
      <p>Switch to another app after clicking: the notification arrives three seconds later.</p>
      <Button onclick={notifyLater}>Notify in 3 seconds</Button>
    </Section>
    <Section title="Files" headingLevel={2}>
      <p>
        Drop text files anywhere on the window, or open them with the native dialog. In a browser
        the same Dropzone takes the page's own drops and the button opens the browser's picker.
      </p>
      <Dropzone
        bind:this={dropzone}
        accept=".txt,.md,.json"
        multiple
        window
        externalDragging={desktop.fileDrop?.dragging}
        hint="Text, Markdown or JSON"
        onFiles={(accepted) => (received = [...received, ...accepted.map((file) => file.name)])}
      />
      <p>{received.length ? `Received: ${received.join(', ')}` : 'No files yet.'}</p>
      <div class="ldt-cluster">
        <Button onclick={openFiles}>Open files…</Button>
        <Button variant="quiet" onclick={saveNotes}>Save the list…</Button>
      </div>
      {#if saved}<p role="status">{saved}</p>{/if}
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

<ToastViewport
  onpointerenter={toaster.pause}
  onpointerleave={toaster.resume}
  onfocusin={toaster.pause}
  onfocusout={toaster.resume}
>
  {#each toaster.toasts as toast (toast.id)}
    <Toast {...toast} onDismiss={() => toaster.dismiss(toast.id)} />
  {/each}
</ToastViewport>

<style>
  .example-page {
    padding: var(--loidolt-space-6);
  }
</style>
