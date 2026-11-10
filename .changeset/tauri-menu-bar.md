---
'@loidolt/theme-tauri': minor
---

Add the native menu bar, built from the command registry. Pass `@tauri-apps/api/menu` and `menuBar: { commands }` to `setupTauri` (or call `createMenuBar({ menu, commands })`), and `desktop.menuBar` keeps the menus in step with the registry:

- One menu per group, in order. Each command is an item with its label, its first shortcut as the accelerator and its enabled state; choosing it runs the command. Labels, enabled states (including an `enabled` function that reads `$state`) and shortcuts change on the item in place, and a command coming or going rebuilds the menu.
- On macOS the bar has the app menu (About, Hide, Quit), an Edit menu with the clipboard items, so copy and paste work in the web view, and a Window menu, each optional (`appMenu`, `editMenu`, `windowMenu`). On Windows and Linux it is the window's own menu bar, with the registry's groups alone.
- A keystroke runs its command once: the registry's shortcut listener and the menu accelerator never both act on the same key. Only chords and function keys become accelerators, so a plain-key shortcut never fires while the user types.
- `layout` rearranges the menus before they are built, `labels` translates the headings and built-in items, and `refresh()` re-reads the registry on demand. Teardown puts back the menu bar that was there before. A no-op in a browser.
