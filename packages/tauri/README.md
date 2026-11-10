# @loidolt/theme-tauri

[Tauri 2](https://tauri.app) adapters that carry the Loidolt theme into desktop apps. The
components already render well in a window; these make them behave like the desktop around them.

- **Knows where it runs.** `isTauri()` and `tauriPlatform()` tell a Tauri window from a browser,
  and macOS from Windows and Linux, without loading the Tauri runtime.
- **Desktop manners.** Inside a window, `<html>` carries `data-tauri-platform`, and the stylesheet
  stops clicks and drags across the app's chrome from selecting button and tab labels, as in a
  native window. Content stays selectable.
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

| Module                  | Turns on                                                         |
| ----------------------- | ---------------------------------------------------------------- |
| `@tauri-apps/plugin-os` | The platform read from Rust instead of the web view's user agent |

## Set up

**1. The stylesheet**, after the theme's:

```css
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-tauri/styles.css';
```

**2. The root layout:**

```svelte
<script lang="ts">
  import * as os from '@tauri-apps/plugin-os';
  import { setupTauri } from '@loidolt/theme-tauri';

  const desktop = setupTauri({ plugins: { os } });

  let { children } = $props();
</script>

{@render children()}
```

`os` is optional: `setupTauri()` with no arguments reads the platform from the user agent.
`desktop.platform` is `'macos'`, `'windows'`, `'linux'` (or `'ios'`, `'android'` for Tauri's
mobile targets), or `null` in a browser. `desktop.ready` settles once every adapter that needs a
round trip to Rust has applied, and `desktop.destroy()` removes everything; it runs on its own
when `setupTauri` is called during component initialisation.

`markPlatform: false` leaves `<html>` alone.

## Exports

Each piece is also exported on its own. Every one is a no-op outside a Tauri window.

| Export              | Does                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------- |
| `setupTauri`        | Every adapter in one call; returns `platform`, `ready` and `destroy()`                |
| `isTauri`           | Whether the page runs in a Tauri 2 window (`window.isTauri` or `__TAURI_INTERNALS__`) |
| `tauriPlatform`     | `'macos'`, `'windows'`, `'linux'`, `'ios'`, `'android'` or `null`                     |
| `markTauriPlatform` | `data-tauri-platform` on `<html>` (or an element), for platform-specific CSS          |

`isTauri` reads the same global as `isTauri()` from `@tauri-apps/api/core`, so the two agree; this
one never loads the Tauri runtime, which keeps it safe in a server bundle.

### Styles

`styles.css` is zero-specificity throughout, so your own CSS always wins, and inert in a browser:
every rule keys to `data-tauri-platform`.

- Under `data-tauri-platform`: buttons, switches, tabs, toggle groups, navigation and the topbar
  do not select their labels.

## Example app

[`examples/tauri`](../../examples/tauri) is a minimal Tauri 2 app on this package, for trying the
adapters in a real window. It needs Rust; see its README.
