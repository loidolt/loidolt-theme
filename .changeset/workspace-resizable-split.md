---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

`Workspace` can now split its main pane and inspector with a draggable divider: set `resizable`. Drag it with a mouse, pen or finger, or focus it and use the keyboard: it is a `role="separator"` that Left/Right move (Shift for bigger steps), Home/End send to the limits and Enter collapses and restores. The size is the inspector's percentage of the width the two panes share. Bind it with `bind:inspectorSize` (default 30), bound it with `inspectorMinSize`/`inspectorMaxSize` (15 and 70), and set the arrow-key step with `resizeStep` (2). The divider reports the same percentages as `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, names the inspector in `aria-controls`, and takes its accessible name from `resizeLabel` ('Resize inspector'). Pass a `storageKey` and the size is kept in `localStorage`; a server-rendered page restores it before first paint. Below the compact breakpoint the panes stack and the divider is hidden. Without `resizable`, `Workspace` renders exactly as before; with it, the inspector sits inside a `.ldt-workspace__inspector` wrapper.
