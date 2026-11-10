---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

New `Dropzone`: a drop target for files that is also a file picker. The area is the label of a real, visually hidden `<input type="file">`, so a click, Enter or Space opens the native picker, `label` is the accessible name, and `name` submits the accepted files with a form. `accept` uses the `<input accept>` syntax (`.pdf`, `application/pdf`, `image/*`), with optional `multiple`, `maxSize` (bytes) and `maxFiles`. Every batch, whether dropped, picked or handed over, reaches `onFiles(accepted, rejected)`, where each rejection carries a `reason` of `type`, `size` or `count`. The rejection message shows under the area, describes the input and is announced through a live region; `rejectedLabel` and `addedLabel` reword it.

The root carries `data-dragging` while files are over the area, with nested enter/leave events counted so the state does not flicker. Set `window` to take files dropped anywhere on the page too: the root gets `data-window-dragging` and an overlay covers the viewport.

To feed it files from another source, such as a desktop shell's native drop event, a paste handler or a test, call `addFiles(files)` on the component instance (`bind:this`). It takes a `File[]` or `FileList`, runs the same filtering, message and callback, and returns `{ accepted, rejected }`. `open()` opens the picker from your own control.

The filter is exported for other code that receives files: `matchesAccept(file, accept)`, `filterFiles(files, options)` and `parseAccept(accept)`.
