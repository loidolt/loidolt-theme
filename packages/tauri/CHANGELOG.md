# @loidolt/theme-tauri

## 0.12.0

### Minor Changes

- [#65](https://github.com/loidolt/loidolt-theme/pull/65) [`faf3870`](https://github.com/loidolt/loidolt-theme/commit/faf387081d52dade60eb56ff95d27ea95a94ed79) Thanks [@loidolt](https://github.com/loidolt)! - Add native file dialogs and window file drops to `@loidolt/theme-tauri`. Pass `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs` and `getCurrentWebview` from `@tauri-apps/api/webview` to `setupTauri`, then:

  - `desktop.files.pick({ accept, multiple })` opens the native open dialog, with `accept` turned into its filters, and resolves the chosen files as `File`s with their `path`, ready for the same upload code as a `Dropzone`. `pickPaths({ directory })` gives the paths unread, folders included. `save(file)` asks where with the native save dialog and writes the file there, resolving `{ method: 'filesystem', path }` or `{ method: 'cancelled' }`. In a browser the same calls use a file input and a download, like `createFiles` in `@loidolt/theme-capacitor`.
  - `fileDrop: { target: () => dropzone }` reads files dropped on the window (which a Tauri window takes before the page's own drop events) and delivers them into a `Dropzone` through `addFiles()`. `desktop.fileDrop.dragging` is reactive while files are over the window; `onFiles`, `onPaths` and `onError` are there for code of your own.

  Both are also exported on their own (`createDesktopFiles`, `createFileDrop`), with `acceptToFilters`, `readDesktopFiles` and `mimeTypeOf`. The README lists the capabilities to allow (`dialog:default`, `fs:allow-read-file`, `fs:allow-write-file`), how `dragDropEnabled` decides who gets a drop, and what to do with very large files.

  `Dropzone` gains `externalDragging`, which shows its window-drag overlay for a drag the page cannot see itself, such as one over a Tauri window.

- [#63](https://github.com/loidolt/loidolt-theme/pull/63) [`be28dd7`](https://github.com/loidolt/loidolt-theme/commit/be28dd70f5a511ea4f80771d3b2282539d276c9d) Thanks [@loidolt](https://github.com/loidolt)! - Add what an app needs to keep working in the background: one instance, deep links and a tray icon. Pass `@tauri-apps/api`'s `event`, `tray` and `menu` modules and `@tauri-apps/plugin-deep-link` to `setupTauri`, then:

  - `singleInstance: { onSecondInstance }` hands each second launch, forwarded from Rust by `tauri-plugin-single-instance`, to the running app as `{ args, cwd, files }`. `filesFromArgs` reads the file paths from a command line. The README shows the Rust side.
  - `deepLinks: { navigate }` routes `myapp://projects/42` to `/projects/42`, both the link that launched the app and every one that arrives while it runs. `resolve` and `onUrl` customise it.
  - `tray: { icon, tooltip, items, onClick }` puts an icon in the menu bar or system tray with a menu built from `{ id, label, enabled?, action? }`, `'separator'` and `'quit'` entries. `desktop.tray.update()` changes it, and teardown removes it.

  Each is also exported on its own (`handleSecondInstance`, `handleDeepLinks`, `createTray`), and each is a no-op in a browser.

- [#66](https://github.com/loidolt/loidolt-theme/pull/66) [`08a39b6`](https://github.com/loidolt/loidolt-theme/commit/08a39b6b042777fcc01df0b35370e68109bfb856) Thanks [@loidolt](https://github.com/loidolt)! - Add the native menu bar, built from the command registry. Pass `@tauri-apps/api/menu` and `menuBar: { commands }` to `setupTauri` (or call `createMenuBar({ menu, commands })`), and `desktop.menuBar` keeps the menus in step with the registry:

  - One menu per group, in order. Each command is an item with its label, its first shortcut as the accelerator and its enabled state; choosing it runs the command. Labels, enabled states (including an `enabled` function that reads `$state`) and shortcuts change on the item in place, and a command coming or going rebuilds the menu.
  - On macOS the bar has the app menu (About, Hide, Quit), an Edit menu with the clipboard items, so copy and paste work in the web view, and a Window menu, each optional (`appMenu`, `editMenu`, `windowMenu`). On Windows and Linux it is the window's own menu bar, with the registry's groups alone.
  - A keystroke runs its command once: the registry's shortcut listener and the menu accelerator never both act on the same key. Only chords and function keys become accelerators, so a plain-key shortcut never fires while the user types.
  - `layout` rearranges the menus before they are built, `labels` translates the headings and built-in items, and `refresh()` re-reads the registry on demand. Teardown puts back the menu bar that was there before. A no-op in a browser.

- [#61](https://github.com/loidolt/loidolt-theme/pull/61) [`d78d24e`](https://github.com/loidolt/loidolt-theme/commit/d78d24ec5ddccc44b68587857db6f93634fbad8c) Thanks [@loidolt](https://github.com/loidolt)! - Add OS notifications. Pass `@tauri-apps/plugin-notification` to `setupTauri({ plugins: { notification } })` and `desktop.notifications` sends notifications from Rust, with the permission handled: `permission` is reactive (`'granted'`, `'denied'`, `'default'` or `'unsupported'`), `requestPermission()` asks only while nobody has answered and never throws, and `notify({ title, body })` resolves whether the notification reached the OS without ever prompting, so background work can call it freely. In a browser the same code goes through the Web Notifications API (ask from a click: browsers ignore a prompt no user gesture asked for), and with `notifications: { toaster }` anything that cannot be shown becomes an in-app toast. `createNotifications({ plugin, toaster })` is the same on its own.

- [#57](https://github.com/loidolt/loidolt-theme/pull/57) [`c56817e`](https://github.com/loidolt/loidolt-theme/commit/c56817e5b73bb02ece4233d6fe31ef998c3b3d00) Thanks [@loidolt](https://github.com/loidolt)! - New package, `@loidolt/theme-tauri`: adapters that carry the theme into Tauri 2 desktop apps, built like `@loidolt/theme-capacitor`. Tauri modules are passed in, never imported, so the browser and server builds never load the Tauri runtime, and every adapter is a no-op outside a Tauri window.

  - `isTauri()` tells a Tauri window from a browser, and `tauriPlatform()` names the OS (`'macos'`, `'windows'`, `'linux'`, …), from `@tauri-apps/plugin-os` when you pass it or from the user agent otherwise.
  - `setupTauri()` is the one call for the root layout. For now it writes `data-tauri-platform` on `<html>` (also exported on its own as `markTauriPlatform`); window chrome, the native menu bar, file dialogs and drop, notifications, and deep links will plug into it.
  - `@loidolt/theme-tauri/styles.css` gives the app's chrome desktop manners: button, tab and navigation labels are not selected by clicks and drags inside a window.

  `@tauri-apps/api` 2 and the plugins the coming adapters use are optional peer dependencies.

- [#62](https://github.com/loidolt/loidolt-theme/pull/62) [`f1c68a4`](https://github.com/loidolt/loidolt-theme/commit/f1c68a438cbb394adb63794ca4016e95c586612f) Thanks [@loidolt](https://github.com/loidolt)! - `@loidolt/theme-tauri` now handles the window around the app. Pass `getCurrentWindow` from `@tauri-apps/api/window` (uncalled, so the layout stays browser-safe) and the app's `createTheme` store to `setupTauri`:

  ```ts
  setupTauri({ plugins: { window: getCurrentWindow }, theme, chrome: { titleBar: 'overlay' } });
  ```

  - The window background follows the page's live `background` colour through every theme and preset change, and its native light or dark appearance follows the theme, handing back to the OS for `system` (`syncWindowAppearance`).
  - No white flash on launch: start the window hidden (`"visible": false` in `tauri.conf.json`) with `windowBackground()` as its `backgroundColor`, and `setupTauri` shows it once the window has its colours and the fonts are in (`showWindow`). `desktop.ready` settles after that.
  - Under a macOS overlay title bar (`"titleBarStyle": "Overlay"`), `chrome: { titleBar: 'overlay' }` clears the window buttons through `--ldt-safe-top` (a 28px strip) or, with `trafficLights: 'beside'`, `--ldt-safe-left` on the top bar, and gives the room back in full screen (`insetWindowChrome`).

  The window calls need `core:window:allow-set-background-color`, `allow-set-theme`, `allow-show` and, for dragging, `allow-start-dragging` in the capability file; a refused call is swallowed.

  `Topbar` takes `dragRegion`, which sets `data-tauri-drag-region` on the bar and its regions so it drags a Tauri window like a title bar, while its buttons, links and fields stay clickable. A plain attribute everywhere else.

### Patch Changes

- Updated dependencies [[`1b5678a`](https://github.com/loidolt/loidolt-theme/commit/1b5678aa6b552c96c3d74bd6f2cec0e97d81a625), [`e8a4555`](https://github.com/loidolt/loidolt-theme/commit/e8a45557d45db822dec2ccc60becafd234b272a9), [`a25b900`](https://github.com/loidolt/loidolt-theme/commit/a25b900a5e99317cf1034bc31772de2616f879b4), [`64f2b57`](https://github.com/loidolt/loidolt-theme/commit/64f2b577ac84803f8ffacc0fc328292b352b12ac), [`95f22c5`](https://github.com/loidolt/loidolt-theme/commit/95f22c5a29d10d0685e81515de36fbf7e5f9bede), [`a35eb76`](https://github.com/loidolt/loidolt-theme/commit/a35eb762a4bfd8ada0c235a6d30459f0c31d3ae7), [`157376e`](https://github.com/loidolt/loidolt-theme/commit/157376e13798aeed7d3d8307396054c6569c3818), [`4f60a5b`](https://github.com/loidolt/loidolt-theme/commit/4f60a5bf8f8ee0fe22d0b0af0034acc1b1311b31), [`faf3870`](https://github.com/loidolt/loidolt-theme/commit/faf387081d52dade60eb56ff95d27ea95a94ed79), [`f1c68a4`](https://github.com/loidolt/loidolt-theme/commit/f1c68a438cbb394adb63794ca4016e95c586612f), [`f912288`](https://github.com/loidolt/loidolt-theme/commit/f912288a6453e5a2015a86bb2bf902c593a66ada)]:
  - @loidolt/theme-svelte@0.12.0
  - @loidolt/theme-tokens@0.12.0
