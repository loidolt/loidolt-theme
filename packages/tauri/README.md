# @loidolt/theme-tauri

[Tauri 2](https://tauri.app) adapters that carry the Loidolt theme into desktop apps. The
components already render well in a window; these make them behave like the desktop around them.

- **Knows where it runs.** `isTauri()` and `tauriPlatform()` tell a Tauri window from a browser,
  and macOS from Windows and Linux, without loading the Tauri runtime.
- **Desktop manners.** Inside a window, `<html>` carries `data-tauri-platform`, and the stylesheet
  stops clicks and drags across the app's chrome from selecting button and tab labels, as in a
  native window. Content stays selectable.
- **Window chrome.** The window's background and light or dark appearance follow the theme, it
  opens without a white flash, and under a macOS overlay title bar the page clears the window
  buttons. `Topbar` drags the window.
- **Inert on the web.** Every adapter checks for a Tauri window first, so the same root layout
  ships to the browser and to the server unchanged.

Tauri modules are passed in, never imported: install only the plugins you want, and each adapter
turns on when you hand it its module. Their typings are checked against the real packages in this
repository's test suite.

## Install

```sh
npm install @loidolt/theme-tauri
```

`@tauri-apps/api` 2 and the plugins below are optional peer dependencies. Add whichever you want
adapters for, together with the matching Rust crate in `src-tauri`:

```sh
npm install @tauri-apps/plugin-os
```

| Module                                      | Turns on                                                         |
| ------------------------------------------- | ---------------------------------------------------------------- |
| `@tauri-apps/api` (`getCurrentWindow`)      | Window background, appearance, overlay title bar, hidden launch  |
| `@tauri-apps/plugin-os`                     | The platform read from Rust instead of the web view's user agent |
| `@tauri-apps/plugin-notification`           | OS notifications from Rust, in `desktop.notifications`           |
| `@tauri-apps/api` (`event`, `tray`, `menu`) | Second launches, and a tray icon with a menu                     |
| `@tauri-apps/plugin-deep-link`              | URLs that open the app, routed into it                           |

## Set up

**1. The stylesheet**, after the theme's:

```css
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-tauri/styles.css';
```

**2. The root layout:**

```svelte
<script lang="ts">
  import { getCurrentWindow } from '@tauri-apps/api/window';
  import * as os from '@tauri-apps/plugin-os';
  import { setupTauri } from '@loidolt/theme-tauri';
  import { theme } from '$lib/theme'; // the app's createTheme()

  const desktop = setupTauri({ plugins: { os, window: getCurrentWindow }, theme });

  let { children } = $props();
</script>

{@render children()}
```

Every module is optional: `setupTauri()` with no arguments reads the platform from the user agent.
`desktop.platform` is `'macos'`, `'windows'`, `'linux'` (or `'ios'`, `'android'` for Tauri's
mobile targets), or `null` in a browser. `desktop.ready` settles once every adapter that needs a
round trip to Rust has applied, and `desktop.destroy()` removes everything; it runs on its own
when `setupTauri` is called during component initialisation.

`markPlatform: false` leaves `<html>` alone.

## Window chrome

Give `setupTauri` the window and the window follows the page. Pass `getCurrentWindow` from
`@tauri-apps/api/window` uncalled: it reads the Tauri runtime and throws in a browser, so
`setupTauri` calls it only inside a window. (The standalone exports below take the window itself;
check `isTauri()` before calling `getCurrentWindow()` for them.)

- **Background.** The window is filled with the page's live `background` colour, which is what
  shows before the first frame and while a window resizes, and it follows every theme and preset
  change. `appearance: { backgroundRole: 'surface' }` picks another role.
- **Appearance.** With `theme` (the app's `createTheme` store), an explicit light or dark choice
  reaches the native window: menus, dialogs and scroll bars match. `system` hands the appearance
  back to the OS. Without `theme` the appearance is left to the OS, since pinning it from the page
  would also pin the web view's `prefers-color-scheme`.
- **No white flash.** Start the window hidden and give it the theme's launch colour.
  `setupTauri` shows it once the window has its colours and the fonts are in (or after 3 s), and
  `desktop.ready` settles after that. `show: false` leaves showing to you;
  `show: { waitForFonts: false, timeout: 1000 }` tunes the wait.
- **Overlay title bar.** On macOS, `chrome: { titleBar: 'overlay' }` makes room for the window
  buttons under a transparent title bar through the theme's safe-area knobs, and gives the room
  back in full screen, where they hide. By default `--ldt-safe-top` reserves a 28px strip for
  them, which `Topbar` grows by and drawers and toasts clear. `trafficLights: 'beside'` puts them
  in the `Topbar` row instead, inset from the left by 78px (`--ldt-safe-left` on the bar only);
  move them into the bar's middle with `trafficLightPosition`. `top` and `left` change the room.
  `<html>` carries `data-tauri-traffic-lights` while the buttons show. A no-op on Windows and
  Linux.
- **Dragging.** `<Topbar dragRegion>` sets `data-tauri-drag-region` on the bar, so it moves the
  window like a title bar; its buttons, links and fields stay clickable.

```jsonc
// src-tauri/tauri.conf.json, in app.windows[0]
{
  "visible": false,
  "backgroundColor": "#ebe7dc", // windowBackground('light'); '#161814' for a dark-first app
  "titleBarStyle": "Overlay",
  "hiddenTitle": true,
}
```

```svelte
<script lang="ts">
  const desktop = setupTauri({
    plugins: { window: getCurrentWindow },
    theme,
    chrome: { titleBar: 'overlay' },
  });
</script>

<Topbar dragRegion>…</Topbar>
```

Each window call needs its permission in the capability file, on top of `core:default`:

```json
"permissions": [
  "core:default",
  "core:window:allow-set-background-color",
  "core:window:allow-set-theme",
  "core:window:allow-show",
  "core:window:allow-start-dragging"
]
```

A refused call is swallowed, and the window is still shown, so a missing permission costs the
effect, never the app. `appearance`, `chrome` and `show` each take `false` to turn one off.

## Notifications

```svelte
<script lang="ts">
  import * as notification from '@tauri-apps/plugin-notification';
  import { setupTauri } from '@loidolt/theme-tauri';
  import { toaster } from '$lib/app'; // the app's createToaster(), optional

  const desktop = setupTauri({ plugins: { notification }, notifications: { toaster } });
</script>

<button onclick={() => desktop.notifications?.requestPermission()}>Turn on notifications</button>
```

```ts
// later, from anywhere, for example when a background job ends:
const shown = await desktop.notifications?.notify({
  title: 'Export finished',
  body: 'The file is ready in your downloads.',
});
```

`desktop.notifications` (or `createNotifications({ plugin, toaster })` on its own) picks the best
way out once, as `backend`:

- **`'tauri'`**: inside a window, with `@tauri-apps/plugin-notification` passed in. Register
  `tauri_plugin_notification::init()` in `src-tauri/src/lib.rs` and allow `notification:default`
  in the capability file.
- **`'web'`**: in a browser, or a window without the plugin, through the Web Notifications API.
- **`'none'`**: neither, as on the server.

`permission` is reactive: `'granted'`, `'denied'`, `'default'` (not asked yet) or `'unsupported'`.
`requestPermission()` asks only while it is `'default'` and resolves the new state; it never
throws. In a browser, call it from a click or key handler: browsers ignore, or permanently block,
a prompt that no user gesture asked for. `notify()` never prompts, so background work can call it
freely; it resolves `true` when the notification reached the OS. Whatever it cannot show (no
permission, no API, or a browser like Android Chrome that only notifies through a service worker)
becomes an `info` toast when a `toaster` was given, and it still resolves `false`.

`notifications: false` leaves `desktop.notifications` out.

## Running in the background

For an app that keeps working with its window closed: one instance, links that open it, and a
tray icon.

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { defaultWindowIcon } from '@tauri-apps/api/app';
  import * as event from '@tauri-apps/api/event';
  import * as menu from '@tauri-apps/api/menu';
  import * as tray from '@tauri-apps/api/tray';
  import * as deepLink from '@tauri-apps/plugin-deep-link';
  import { isTauri, setupTauri } from '@loidolt/theme-tauri';

  const desktop = setupTauri({
    plugins: { event, deepLink, tray, menu },
    singleInstance: { onSecondInstance: ({ files }) => files.forEach(openFile) },
    deepLinks: { navigate: goto },
    tray: {
      icon: isTauri() ? defaultWindowIcon() : null,
      tooltip: 'Watching for new files',
      items: [{ id: 'show', label: 'Show window', action: showWindow }, 'separator', 'quit'],
      onClick: showWindow,
    },
  });
</script>
```

Each piece is on only when its module and its options are both given, and does nothing in a
browser. They are also exported on their own: `handleSecondInstance`, `handleDeepLinks` and
`createTray`, each returning its teardown (`createTray` an object with `destroy()`).

### Single instance

`tauri-plugin-single-instance` has no JavaScript side. Register it **first** in
`src-tauri/src/lib.rs`, with a callback that focuses the running window and emits the second
launch as an event:

```rust
use tauri::{Emitter, Manager};

#[derive(Clone, serde::Serialize)]
struct SecondInstance { args: Vec<String>, cwd: String }

tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, args, cwd| {
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.unminimize();
            let _ = window.show();
            let _ = window.set_focus();
        }
        let _ = app.emit("single-instance", SecondInstance { args, cwd });
    }))
```

`singleInstance: { onSecondInstance }` (or `handleSecondInstance({ event, onSecondInstance })`)
listens for it and calls back with `{ args, cwd, files }`. `files` are the paths in `args`:
everything after the executable that is not a flag or a URL, resolved against `cwd`
(`filesFromArgs(args, cwd)` does the same on its own). Rust may send `files` itself; on macOS,
which keeps one instance on its own, files opened from the Finder while the app runs arrive as
`RunEvent::Opened`, and `examples/tauri` forwards those as the same event. `eventName` changes
`'single-instance'`.

### Deep links

Pass `@tauri-apps/plugin-deep-link` (`tauri_plugin_deep_link::init()`, `deep-link:default`) and
`deepLinks: { navigate }`: the link that launched the app is read once at startup, and every link
that arrives while it runs follows. `deepLinkPath` turns `myapp://projects/42` into
`/projects/42`; `resolve` replaces it (return `null` to skip one), and `onUrl` sees every raw URL.

Declare the scheme in `tauri.conf.json`:

```json
{ "plugins": { "deep-link": { "desktop": { "schemes": ["myapp"] } } } }
```

On macOS the scheme is registered from the bundle's `Info.plist`, so links only open a built and
installed app (`tauri build`), not `tauri dev`. On Windows and Linux, call
`app.deep_link().register_all()` in `setup` for development, and enable the `deep-link` feature of
`tauri-plugin-single-instance` so a link opened while the app runs reaches the running instance
instead of starting a second one.

### Tray icon

Pass `@tauri-apps/api/tray` and `@tauri-apps/api/menu` (and enable the `tray-icon` feature of the
`tauri` crate) with `tray` options, and `desktop.tray` is an icon in the menu bar or system tray:
`icon` (a path, bytes, an `Image`, or a promise of one such as `defaultWindowIcon()`), `tooltip`,
`title` (macOS, beside the icon), and `items`, a list of `{ id, label, enabled?, action? }`,
`'separator'` or `'quit'` (the platform's own Quit item; not on Linux). `onClick` handles a left
click on the icon, and then the menu opens on a right click only.

`desktop.tray.update({ tooltip, title, icon, items })` changes what it is given, and teardown
removes the icon and frees its menu.

## Exports

Each piece is also exported on its own. Every one is a no-op outside a Tauri window, except
`createNotifications`, which falls back to the Web Notifications API.

| Export                 | Does                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------- |
| `setupTauri`           | Every adapter in one call; returns `platform`, `ready` and `destroy()`                      |
| `isTauri`              | Whether the page runs in a Tauri 2 window (`window.isTauri` or `__TAURI_INTERNALS__`)       |
| `tauriPlatform`        | `'macos'`, `'windows'`, `'linux'`, `'ios'`, `'android'` or `null`                           |
| `markTauriPlatform`    | `data-tauri-platform` on `<html>` (or an element), for platform-specific CSS                |
| `syncWindowAppearance` | The window background in the live page colour, and with `theme`, its appearance             |
| `insetWindowChrome`    | Insets the page clear of the macOS window buttons under an overlay title bar                |
| `showWindow`           | Shows a window that starts hidden once the theme and fonts are in                           |
| `windowBackground`     | The theme's launch colour, for `backgroundColor` in `tauri.conf.json`                       |
| `createNotifications`  | `permission`, `requestPermission()` and `notify()`; the Web Notifications API outside Tauri |
| `handleSecondInstance` | Second launches forwarded by `tauri-plugin-single-instance`, with their files               |
| `filesFromArgs`        | The file paths in a command line, resolved against its working directory                    |
| `handleDeepLinks`      | Links that open the app, at startup and while it runs, into its router                      |
| `deepLinkPath`         | `myapp://projects/42` → `/projects/42`                                                      |
| `createTray`           | A tray icon with a menu, `update()` and `destroy()`                                         |

`isTauri` reads the same global as `isTauri()` from `@tauri-apps/api/core`, so the two agree; this
one never loads the Tauri runtime, which keeps it safe in a server bundle.

### Styles

`styles.css` is zero-specificity throughout, so your own CSS always wins, and inert in a browser:
every rule keys to `data-tauri-platform`.

- Under `data-tauri-platform`: buttons, switches, tabs, toggle groups, navigation and the topbar
  do not select their labels.
- Under `data-tauri-traffic-lights="beside"`: the topbar is inset from the left to clear the
  window buttons.

## Example app

[`examples/tauri`](../../examples/tauri) is a minimal Tauri 2 app on this package, for trying the
adapters in a real window. It needs Rust; see its README.
