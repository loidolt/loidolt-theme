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

| Module                                 | Turns on                                                         |
| -------------------------------------- | ---------------------------------------------------------------- |
| `@tauri-apps/api` (`getCurrentWindow`) | Window background, appearance, overlay title bar, hidden launch  |
| `@tauri-apps/plugin-os`                | The platform read from Rust instead of the web view's user agent |

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

## Exports

Each piece is also exported on its own. Every one is a no-op outside a Tauri window.

| Export                 | Does                                                                                  |
| ---------------------- | ------------------------------------------------------------------------------------- |
| `setupTauri`           | Every adapter in one call; returns `platform`, `ready` and `destroy()`                |
| `isTauri`              | Whether the page runs in a Tauri 2 window (`window.isTauri` or `__TAURI_INTERNALS__`) |
| `tauriPlatform`        | `'macos'`, `'windows'`, `'linux'`, `'ios'`, `'android'` or `null`                     |
| `markTauriPlatform`    | `data-tauri-platform` on `<html>` (or an element), for platform-specific CSS          |
| `syncWindowAppearance` | The window background in the live page colour, and with `theme`, its appearance       |
| `insetWindowChrome`    | Insets the page clear of the macOS window buttons under an overlay title bar          |
| `showWindow`           | Shows a window that starts hidden once the theme and fonts are in                     |
| `windowBackground`     | The theme's launch colour, for `backgroundColor` in `tauri.conf.json`                 |

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
