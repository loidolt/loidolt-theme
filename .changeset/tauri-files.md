---
'@loidolt/theme-tauri': minor
'@loidolt/theme-svelte': minor
---

Add native file dialogs and window file drops to `@loidolt/theme-tauri`. Pass `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs` and `getCurrentWebview` from `@tauri-apps/api/webview` to `setupTauri`, then:

- `desktop.files.pick({ accept, multiple })` opens the native open dialog, with `accept` turned into its filters, and resolves the chosen files as `File`s with their `path`, ready for the same upload code as a `Dropzone`. `pickPaths({ directory })` gives the paths unread, folders included. `save(file)` asks where with the native save dialog and writes the file there, resolving `{ method: 'filesystem', path }` or `{ method: 'cancelled' }`. In a browser the same calls use a file input and a download, like `createFiles` in `@loidolt/theme-capacitor`.
- `fileDrop: { target: () => dropzone }` reads files dropped on the window (which a Tauri window takes before the page's own drop events) and delivers them into a `Dropzone` through `addFiles()`. `desktop.fileDrop.dragging` is reactive while files are over the window; `onFiles`, `onPaths` and `onError` are there for code of your own.

Both are also exported on their own (`createDesktopFiles`, `createFileDrop`), with `acceptToFilters`, `readDesktopFiles` and `mimeTypeOf`. The README lists the capabilities to allow (`dialog:default`, `fs:allow-read-file`, `fs:allow-write-file`), how `dragDropEnabled` decides who gets a drop, and what to do with very large files.

`Dropzone` gains `externalDragging`, which shows its window-drag overlay for a drag the page cannot see itself, such as one over a Tauri window.
