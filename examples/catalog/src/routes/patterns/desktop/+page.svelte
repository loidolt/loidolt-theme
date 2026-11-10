<script lang="ts">
  import {
    Badge,
    Button,
    createCommands,
    createToaster,
    Dropzone,
    PageHeader,
    Section,
    Table,
    TableHeader,
    Toast,
    ToastViewport,
  } from '@loidolt/theme-svelte';
  import {
    acceptToFilters,
    createDesktopFiles,
    createNotifications,
    deepLinkPath,
    filesFromArgs,
    isTauri,
    menuAccelerator,
    tauriPlatform,
    windowBackground,
  } from '@loidolt/theme-tauri';
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

  const notificationsCode = `<script lang="ts">
  import * as notification from '@tauri-apps/plugin-notification';
  import { setupTauri } from '@loidolt/theme-tauri';

  const desktop = setupTauri({ plugins: { notification }, notifications: { toaster } });
${endScript}

<!-- ask on a click: browsers ignore a prompt no user gesture asked for -->
<Button onclick={() => desktop.notifications?.requestPermission()}>Turn on notifications</Button>

// later, from anywhere: resolves whether it reached the OS
await desktop.notifications?.notify({ title: 'Export finished', body: 'The file is ready.' });`;

  const background = `<script lang="ts">
  import { goto } from '$app/navigation';
  import { defaultWindowIcon } from '@tauri-apps/api/app';
  import * as event from '@tauri-apps/api/event';
  import * as menu from '@tauri-apps/api/menu';
  import * as tray from '@tauri-apps/api/tray';
  import * as deepLink from '@tauri-apps/plugin-deep-link';
  import { isTauri, setupTauri } from '@loidolt/theme-tauri';

  const desktop = setupTauri({
    plugins: { event, deepLink, tray, menu },
    // a second launch focuses this window and hands over its files
    singleInstance: { onSecondInstance: ({ files }) => files.forEach(openFile) },
    // myapp://projects/42 → goto('/projects/42'), at startup and while running
    deepLinks: { navigate: goto },
    tray: {
      icon: isTauri() ? defaultWindowIcon() : null,
      tooltip: 'Watching for new files',
      items: [
        { id: 'show', label: 'Show window', action: showWindow },
        'separator',
        'quit',
      ],
      onClick: showWindow,
    },
  });
  // later: desktop.tray?.update({ tooltip: '2 jobs running' })
${endScript}`;

  const singleInstanceRust = `// src-tauri/src/lib.rs: registered first, before every other plugin
.plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
    }
    let _ = app.emit("single-instance", SecondInstance { args, cwd });
}))`;

  const deepLinkConfig = `// tauri.conf.json
{ "plugins": { "deep-link": { "desktop": { "schemes": ["myapp"] } } } }`;

  const sampleLink = 'myapp://projects/42?tab=files';
  const sampleArgs = ['/usr/bin/app', '--minimized', 'notes/today.md', '/tmp/report.pdf'];

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
    [
      'createNotifications',
      'permission, requestPermission() and notify(); the Web Notifications API outside Tauri',
    ],
    ['handleSecondInstance', 'Second launches forwarded by tauri-plugin-single-instance'],
    ['filesFromArgs', 'The file paths in a command line, resolved against its directory'],
    ['handleDeepLinks', 'Links that open the app, at startup and while it runs'],
    ['deepLinkPath', 'myapp://projects/42 becomes /projects/42'],
    ['createTray', 'A tray icon with a menu, update() and destroy()'],
    [
      'createDesktopFiles',
      'pick(), pickPaths() and save() through the native dialogs; a file input and a download outside Tauri',
    ],
    [
      'createFileDrop',
      'Files dropped on the window, as Files into a Dropzone, with reactive dragging',
    ],
    ['acceptToFilters', 'An accept string as the dialog filters Tauri takes'],
    ['readDesktopFiles', 'Paths read into Files typed by their extension'],
    ['createMenuBar', 'The native menu bar from a command registry, kept in step with it'],
    ['menuAccelerator', 'The accelerator a command gets in the menu bar, or null for a plain key'],
    ['isMenuBarModule', 'Whether a menu module can build a menu bar, not only a tray menu'],
  ] as const;

  const menuBarCode = `<script lang="ts">
  import * as menu from '@tauri-apps/api/menu';
  import { createCommands } from '@loidolt/theme-svelte';
  import { setupTauri } from '@loidolt/theme-tauri';

  const commands = createCommands();
  commands.registerAll([
    { id: 'new', label: 'New note', shortcut: 'Mod+N', group: 'File', handler: create },
    { id: 'save', label: 'Save', shortcut: 'Mod+S', group: 'File', enabled: () => dirty, handler: save },
    { id: 'zoom-in', label: 'Zoom in', shortcut: 'Mod+=', group: 'View', handler: zoomIn },
  ]);
  $effect(() => commands.listen()); // still runs the shortcuts in a browser

  const desktop = setupTauri({ plugins: { menu }, menuBar: { commands, appName: 'Notes' } });
${endScript}`;

  const menuLayout = `menuBar: {
  commands,
  // Settings… under About; a command placed twice shows only at its first place
  layout: (menus) => {
    menus.find((menu) => menu.id === 'app')?.items.splice(1, 0, 'separator', { command: 'settings' });
    return menus;
  },
  labels: { edit: 'Edit', copy: 'Copy' }, // headings and built-in items, for translation
}`;

  // A registry of its own, for the table below: never listened to, so it runs nothing.
  const sampleCommands = createCommands({ platform: 'mac' });
  sampleCommands.registerAll([
    { id: 'new', label: 'New note', shortcut: 'Mod+N', group: 'File', handler: () => {} },
    { id: 'export', label: 'Export…', shortcut: 'Mod+Shift+E', group: 'File', handler: () => {} },
    { id: 'zoom-in', label: 'Zoom in', shortcut: 'Mod+=', group: 'View', handler: () => {} },
    { id: 'next', label: 'Next item', shortcut: 'Alt+ArrowDown', group: 'View', handler: () => {} },
    { id: 'help', label: 'Keyboard shortcuts', shortcut: '?', group: 'Help', handler: () => {} },
    { id: 'docs', label: 'Documentation', shortcut: 'F1', group: 'Help', handler: () => {} },
  ]);

  const toaster = createToaster({ duration: 6000 });
  const notifications = createNotifications({ toaster });
  let outcome = $state('');

  async function sendSample() {
    const shown = await notifications.notify({
      title: 'Export finished',
      body: 'The report is ready in your downloads.',
    });
    outcome = shown ? 'Sent as a system notification.' : 'Shown as a toast instead.';
  }

  /* Files: dialogs and window drops. */

  const filesCode = `<script lang="ts">
  import { getCurrentWebview } from '@tauri-apps/api/webview';
  import * as dialog from '@tauri-apps/plugin-dialog';
  import * as fs from '@tauri-apps/plugin-fs';
  import { Dropzone } from '@loidolt/theme-svelte';
  import { setupTauri } from '@loidolt/theme-tauri';

  let dropzone = $state<ReturnType<typeof Dropzone>>();

  const desktop = setupTauri({
    plugins: { dialog, fs, webview: getCurrentWebview },
    // files dropped on the window go through the Dropzone's accept and onFiles
    fileDrop: { target: () => dropzone },
  });

  async function openFiles() {
    const files = (await desktop.files?.pick({ accept: '.pdf,image/*', multiple: true })) ?? [];
    dropzone?.addFiles(files);
  }
${endScript}

<Dropzone
  bind:this={dropzone}
  accept=".pdf,image/*"
  multiple
  window
  externalDragging={desktop.fileDrop?.dragging}
  onFiles={upload}
/>
<Button onclick={openFiles}>Open…</Button>
<Button onclick={() => desktop.files?.save(new File([bytes], 'export.pdf'))}>Save…</Button>`;

  const filesCapability = `// src-tauri/capabilities/default.json
{
  "permissions": ["core:default", "dialog:default", "fs:allow-read-file", "fs:allow-write-file"]
}`;

  const dropConfig = `// src-tauri/tauri.conf.json, in app.windows[0]: on by default
{ "dragDropEnabled": true }`;

  const sampleAccept = '.pdf, image/jpeg';
  const sampleFilters = JSON.stringify(acceptToFilters(sampleAccept));

  const files = createDesktopFiles();
  let fileDemoDropzone = $state<ReturnType<typeof Dropzone>>();
  let fileNames = $state<string[]>([]);
  let saveOutcome = $state('');

  async function openSample() {
    const picked = await files.pick({ accept: '.txt,.md,.json', multiple: true });
    if (picked.length) fileDemoDropzone?.addFiles(picked);
  }

  async function saveSample() {
    const outcome = await files.save(
      new File([`${fileNames.join('\n')}\n`], 'files.txt', { type: 'text/plain' })
    );
    saveOutcome = outcome.method === 'download' ? `Downloaded as ${outcome.name}.` : '';
  }

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

<Section title="Notifications" headingLevel={2}>
  <p class="docs-note">
    Pass <code>@tauri-apps/plugin-notification</code> and <code>desktop.notifications</code> sends
    OS notifications from Rust. In a browser it uses the Web Notifications API instead, and with
    neither (or without permission) <code>notify()</code> resolves <code>false</code>, showing a
    toast when given a <code>toaster</code>. <code>notify()</code> never prompts; ask with
    <code>requestPermission()</code> from a click.
  </p>
  <CodeBlock code={notificationsCode} />
  <Demo label="createNotifications on this page, through the Web Notifications API">
    <div class="ldt-stack">
      <p>
        Backend <Badge>{notifications.backend}</Badge> Permission
        <Badge variant={notifications.permission === 'granted' ? 'success' : 'default'}>
          {notifications.permission}
        </Badge>
      </p>
      <div class="ldt-cluster">
        <Button
          variant="quiet"
          disabled={notifications.permission !== 'default'}
          onclick={() => notifications.requestPermission()}
        >
          Ask for permission
        </Button>
        <Button onclick={sendSample}>Send a sample notification</Button>
      </div>
      <p class="ldt-utility-text" role="status">{outcome}</p>
    </div>
  </Demo>
</Section>

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

<Section title="Running in the background" headingLevel={2}>
  <p class="docs-note">
    For an app that keeps working with its window closed. Each piece turns on when it gets both its
    module and its options, and does nothing in a browser.
  </p>
  <CodeBlock code={background} />
  <p class="docs-note">
    <strong>Single instance.</strong> <code>tauri-plugin-single-instance</code> has no JavaScript
    side: register it first in Rust, focus the window there, and emit the launch for
    <code>onSecondInstance</code>. On macOS, files opened from the Finder arrive as
    <code>RunEvent::Opened</code> instead; the example app forwards those as the same event.
  </p>
  <CodeBlock code={singleInstanceRust} />
  <p class="docs-note">
    <strong>Deep links.</strong> Declare the scheme for <code>@tauri-apps/plugin-deep-link</code>.
    macOS registers it from the bundle, so links open an installed build, not
    <code>tauri dev</code>.
  </p>
  <CodeBlock code={deepLinkConfig} />
  <Demo label="deepLinkPath() and filesFromArgs() on sample input">
    <dl class="docs-desktop-facts">
      <dt><code>deepLinkPath</code></dt>
      <dd><code>{sampleLink}</code> → <code>{deepLinkPath(sampleLink)}</code></dd>
      <dt><code>filesFromArgs</code></dt>
      <dd>
        <code>{sampleArgs.join(' ')}</code> in <code>/home/sam</code> →
        <code>{filesFromArgs(sampleArgs, '/home/sam').join(', ')}</code>
      </dd>
    </dl>
  </Demo>
</Section>

<Section title="Files" headingLevel={2}>
  <p class="docs-note">
    Pass <code>@tauri-apps/plugin-dialog</code> and <code>@tauri-apps/plugin-fs</code> and
    <code>desktop.files</code> opens and saves through the native dialogs: <code>pick()</code>
    resolves the chosen files as <code>File</code>s with their <code>path</code>, the same objects a
    <code>Dropzone</code> hands you, and <code>save()</code> asks where and writes there. The API
    matches
    <code>createFiles</code> in the Capacitor package. In a browser, a file input and a download.
  </p>
  <p class="docs-note">
    <strong>Dropped on the window.</strong> A Tauri window takes files dragged in from the OS before
    the page sees them, so HTML drop events never fire. Pass <code>getCurrentWebview</code> uncalled
    and <code>fileDrop</code>: the dropped paths are read into files and handed to the
    <code>Dropzone</code>'s <code>addFiles()</code>, and <code>desktop.fileDrop.dragging</code>
    drives its window overlay through <code>externalDragging</code>.
  </p>
  <CodeBlock code={filesCode} />
  <p class="docs-note">
    Paths picked in a dialog or dropped on the window join the fs scope on their own, so the file
    commands are all the capability file needs. Each file is read whole into memory; for very large
    ones use <code>pickPaths()</code> and read them in Rust.
  </p>
  <CodeBlock code={filesCapability} />
  <p class="docs-note">
    <strong><code>dragDropEnabled</code></strong> is what routes OS drops to Tauri. On Windows it
    also stops HTML drag and drop inside the page; set it to <code>false</code> to keep that, and
    the
    <code>Dropzone</code>'s own <code>window</code> handling takes file drops as in a browser, without
    paths.
  </p>
  <CodeBlock code={dropConfig} />
  <Demo label="createDesktopFiles() and a Dropzone on this page, through the browser">
    <div class="ldt-stack">
      <Dropzone
        bind:this={fileDemoDropzone}
        accept=".txt,.md,.json"
        multiple
        hint="Text, Markdown or JSON"
        onFiles={(accepted) => (fileNames = [...fileNames, ...accepted.map((file) => file.name)])}
      />
      <div class="ldt-cluster">
        <Button onclick={openSample}>Open files</Button>
        <Button variant="quiet" disabled={!fileNames.length} onclick={saveSample}>
          Save the list
        </Button>
      </div>
      <p class="ldt-utility-text" role="status">
        {fileNames.length ? `Received ${fileNames.join(', ')}. ` : ''}{saveOutcome}
      </p>
      <dl class="docs-desktop-facts">
        <dt><code>acceptToFilters</code></dt>
        <dd><code>{sampleAccept}</code> → <code>{sampleFilters}</code></dd>
      </dl>
    </div>
  </Demo>
</Section>

<Section title="Menu bar" headingLevel={2}>
  <p class="docs-note">
    Pass <code>@tauri-apps/api/menu</code> and the app's command registry, and the native menu bar follows
    it: one menu per group, in order, each command an item with its label, its first shortcut as the accelerator
    and its enabled state. Labels, enabled states and accelerators change in place; a command coming or
    going rebuilds the menu. Choosing an item runs the command.
  </p>
  <CodeBlock code={menuBarCode} />
  <p class="docs-note">
    <strong>macOS</strong> gets the app menu (About, Hide, Quit), an Edit menu with the clipboard
    items — without it, copy and paste shortcuts do nothing in the web view — and a Window menu,
    around the registry's groups; groups named Edit and Window join them, and a Help group becomes
    the system Help menu. <strong>Windows and Linux</strong> get the groups alone, on the page's own
    window.
    <code>appMenu</code>, <code>editMenu</code> and <code>windowMenu</code> take <code>false</code>,
    and <code>layout</code> rearranges the menus before they are built.
  </p>
  <CodeBlock code={menuLayout} />
  <p class="docs-note">
    <strong>One keystroke, one run.</strong> The page sees a key before the menu does on macOS, so a shortcut
    the registry handled never fires the menu item too; for web views that deliver both, the menu bar
    skips the second. Only chords and function keys become accelerators: a plain key would fire while
    the user types.
  </p>
  <Table caption="What a sample registry's commands get in the menu bar, from menuAccelerator()">
    <thead>
      <tr>
        <TableHeader>Menu</TableHeader>
        <TableHeader>Item</TableHeader>
        <TableHeader>Shortcut</TableHeader>
        <TableHeader>Accelerator</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each sampleCommands.list() as command (command.id)}
        {@const accelerator = menuAccelerator(command)}
        <tr>
          <td>{command.group}</td>
          <td>{command.label}</td>
          <td><code>{command.shortcuts[0]?.source}</code></td>
          <td>
            {#if accelerator}<code>{accelerator}</code>{:else}none: left to the page{/if}
          </td>
        </tr>
      {/each}
    </tbody>
  </Table>
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
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }
</style>
