---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

New `createCommands()`: a registry of commands and keyboard shortcuts. Register `{ id, label, shortcut, handler, enabled, group, description, allowInInputs }` and get back an unregister function; `$effect(() => commands.listen())` then runs each command from its shortcut, and `execute(id)` runs it from a button or menu. Shortcuts are written `Mod+Shift+S`, `Alt+ArrowDown`, `?` or `F8`, where `Mod` is Command on macOS and iOS and Control elsewhere. Keys typed into text fields are left alone unless a command opts in with `allowInInputs`, as are keys pressed during IME composition; disabled commands neither run nor swallow their key; and when two commands share a shortcut, the last registered wins. `list()` and `groups()` are reactive, and `version` / `subscribe` signal changes, so a native menu bar can be built from the same registry.

Shortcut helpers for your own UI: `formatShortcut` (`⇧⌘S` on a Mac, `Ctrl+Shift+S` elsewhere), `shortcutKeys` (one string per key cap), `describeShortcut` (words for screen readers), `toAccelerator` (`CmdOrCtrl+Shift+S` for Tauri and Electron menus), `parseShortcut`, `matchesShortcut` and `detectPlatform`.

New `ShortcutHelp`: a dialog listing a registry's shortcuts by group as `<kbd>` key caps, with a spoken reading for screen readers. It registers `?` to open itself while mounted; `shortcut={null}` turns that off, so a single-character shortcut can be disabled as WCAG 2.1.4 asks. Styles for the dialog and a reusable `.ldt-kbd` key cap ship in `@loidolt/theme-styles`.
