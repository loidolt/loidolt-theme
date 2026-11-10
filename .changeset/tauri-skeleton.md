---
'@loidolt/theme-tauri': minor
---

New package, `@loidolt/theme-tauri`: adapters that carry the theme into Tauri 2 desktop apps, built like `@loidolt/theme-capacitor`. Tauri modules are passed in, never imported, so the browser and server builds never load the Tauri runtime, and every adapter is a no-op outside a Tauri window.

- `isTauri()` tells a Tauri window from a browser, and `tauriPlatform()` names the OS (`'macos'`, `'windows'`, `'linux'`, …), from `@tauri-apps/plugin-os` when you pass it or from the user agent otherwise.
- `setupTauri()` is the one call for the root layout. For now it writes `data-tauri-platform` on `<html>` (also exported on its own as `markTauriPlatform`); window chrome, the native menu bar, file dialogs and drop, notifications, and deep links will plug into it.
- `@loidolt/theme-tauri/styles.css` gives the app's chrome desktop manners: button, tab and navigation labels are not selected by clicks and drags inside a window.

`@tauri-apps/api` 2 and the plugins the coming adapters use are optional peer dependencies.
