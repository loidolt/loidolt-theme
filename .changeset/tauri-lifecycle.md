---
'@loidolt/theme-tauri': minor
---

Add what an app needs to keep working in the background: one instance, deep links and a tray icon. Pass `@tauri-apps/api`'s `event`, `tray` and `menu` modules and `@tauri-apps/plugin-deep-link` to `setupTauri`, then:

- `singleInstance: { onSecondInstance }` hands each second launch, forwarded from Rust by `tauri-plugin-single-instance`, to the running app as `{ args, cwd, files }`. `filesFromArgs` reads the file paths from a command line. The README shows the Rust side.
- `deepLinks: { navigate }` routes `myapp://projects/42` to `/projects/42`, both the link that launched the app and every one that arrives while it runs. `resolve` and `onUrl` customise it.
- `tray: { icon, tooltip, items, onClick }` puts an icon in the menu bar or system tray with a menu built from `{ id, label, enabled?, action? }`, `'separator'` and `'quit'` entries. `desktop.tray.update()` changes it, and teardown removes it.

Each is also exported on its own (`handleSecondInstance`, `handleDeepLinks`, `createTray`), and each is a no-op in a browser.
