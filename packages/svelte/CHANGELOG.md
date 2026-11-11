# @loidolt/theme-svelte

## 0.12.0

### Minor Changes

- [#56](https://github.com/loidolt/loidolt-theme/pull/56) [`1b5678a`](https://github.com/loidolt/loidolt-theme/commit/1b5678aa6b552c96c3d74bd6f2cec0e97d81a625) Thanks [@loidolt](https://github.com/loidolt)! - New `AnnotatedText`: a plain-text editor whose marked ranges stay on their characters while the user edits, for review work such as flagging low-confidence words or automatic corrections. Pass `bind:value` and `bind:marks` (`TextMark`s: `id`, `start`, `end` as UTF-16 offsets with an exclusive end, a status `variant` and a `label`). It is a real `<textarea>` over a mirror that draws the marks, styled like a boxed `Textarea`, so native undo, spellcheck, IME input, mobile selection and `Field` labelling keep working.

  Edits before a mark shift it, edits inside resize it, and a mark with no characters left is dropped. Typing at a mark's start pushes it along; typing at its end does not extend it. `F8` and `Shift+F8` (or the optional previous/next buttons, or `next()`, `previous()` and `focusMark(id)` on the instance) select each mark in turn. Each mark shows its label as a tooltip on hover and while the caret is in it; screen readers hear it through `aria-describedby` and an announcement on entering the mark, and `onMarkChange` reports it to your code.

  The offset logic is exported for use without the component: `shiftMarks(marks, edit)`, `diffText(before, after, caret?)`, plus `markAt`, `nextMark`, `previousMark`, `sortMarks` and `segmentText`.

- [#58](https://github.com/loidolt/loidolt-theme/pull/58) [`a25b900`](https://github.com/loidolt/loidolt-theme/commit/a25b900a5e99317cf1034bc31772de2616f879b4) Thanks [@loidolt](https://github.com/loidolt)! - New `createCommands()`: a registry of commands and keyboard shortcuts. Register `{ id, label, shortcut, handler, enabled, group, description, allowInInputs }` and get back an unregister function; `$effect(() => commands.listen())` then runs each command from its shortcut, and `execute(id)` runs it from a button or menu. Shortcuts are written `Mod+Shift+S`, `Alt+ArrowDown`, `?` or `F8`, where `Mod` is Command on macOS and iOS and Control elsewhere. Keys typed into text fields are left alone unless a command opts in with `allowInInputs`, as are keys pressed during IME composition; disabled commands neither run nor swallow their key; and when two commands share a shortcut, the last registered wins. `list()` and `groups()` are reactive, and `version` / `subscribe` signal changes, so a native menu bar can be built from the same registry.

  Shortcut helpers for your own UI: `formatShortcut` (`⇧⌘S` on a Mac, `Ctrl+Shift+S` elsewhere), `shortcutKeys` (one string per key cap), `describeShortcut` (words for screen readers), `toAccelerator` (`CmdOrCtrl+Shift+S` for Tauri and Electron menus), `parseShortcut`, `matchesShortcut` and `detectPlatform`.

  New `ShortcutHelp`: a dialog listing a registry's shortcuts by group as `<kbd>` key caps, with a spoken reading for screen readers. It registers `?` to open itself while mounted; `shortcut={null}` turns that off, so a single-character shortcut can be disabled as WCAG 2.1.4 asks. Styles for the dialog and a reusable `.ldt-kbd` key cap ship in `@loidolt/theme-styles`.

- [#53](https://github.com/loidolt/loidolt-theme/pull/53) [`64f2b57`](https://github.com/loidolt/loidolt-theme/commit/64f2b577ac84803f8ffacc0fc328292b352b12ac) Thanks [@loidolt](https://github.com/loidolt)! - New `Dropzone`: a drop target for files that is also a file picker. The area is the label of a real, visually hidden `<input type="file">`, so a click, Enter or Space opens the native picker, `label` is the accessible name, and `name` submits the accepted files with a form. `accept` uses the `<input accept>` syntax (`.pdf`, `application/pdf`, `image/*`), with optional `multiple`, `maxSize` (bytes) and `maxFiles`. Every batch, whether dropped, picked or handed over, reaches `onFiles(accepted, rejected)`, where each rejection carries a `reason` of `type`, `size` or `count`. The rejection message shows under the area, describes the input and is announced through a live region; `rejectedLabel` and `addedLabel` reword it.

  The root carries `data-dragging` while files are over the area, with nested enter/leave events counted so the state does not flicker. Set `window` to take files dropped anywhere on the page too: the root gets `data-window-dragging` and an overlay covers the viewport.

  To feed it files from another source, such as a desktop shell's native drop event, a paste handler or a test, call `addFiles(files)` on the component instance (`bind:this`). It takes a `File[]` or `FileList`, runs the same filtering, message and callback, and returns `{ accepted, rejected }`. `open()` opens the picker from your own control.

  The filter is exported for other code that receives files: `matchesAccept(file, accept)`, `filterFiles(files, options)` and `parseAccept(accept)`.

- [#55](https://github.com/loidolt/loidolt-theme/pull/55) [`95f22c5`](https://github.com/loidolt/loidolt-theme/commit/95f22c5a29d10d0685e81515de36fbf7e5f9bede) Thanks [@loidolt](https://github.com/loidolt)! - New `ImageViewer`: an inline, non-modal zoomable image for a pane, such as a scanned page beside its recognised text. It zooms with + and −, pinch, Ctrl + wheel and double-click (around the pointer). It pans with the arrow keys, by dragging, or with the plain wheel once the image overflows. Fit width, Fit height and Fit whole image sit in its controls, and every label is a prop. `regions` draws rectangles given in the image's natural pixels (`{ id, x, y, width, height, label, variant? }`, with variants from the badge set). They are laid out in the same box as the image, so they stay aligned at every zoom. The regions are a keyboard listbox with one tab stop and are named by their labels. Bind `selectedRegionId` and `hoveredRegionId` to link a list beside the viewer both ways: selecting from outside pans the region into view and announces it. `onRegionClick` and `onRegionHover` report pointer use.

  `createMediaZoom()` gains a content mode for this, and `Lightbox` works exactly as before. Pass `contentSize` (or call `setContentSize()`) to zoom in the content's own pixels, with scales below 1 when fitting needs them. The new methods are `fit('contain' | 'width' | 'height')`, `zoomTo(scale, point)`, `pan()` and `reveal(rect)`, and the new options are `stepFactor`, `zoomToPointer` and `wheelPan`. All of them are optional.

- [#54](https://github.com/loidolt/loidolt-theme/pull/54) [`4f60a5b`](https://github.com/loidolt/loidolt-theme/commit/4f60a5bf8f8ee0fe22d0b0af0034acc1b1311b31) Thanks [@loidolt](https://github.com/loidolt)! - New `StageStepper`: an ordered run of named steps, each `pending`, `running`, `done`, `skipped` or `failed`, for showing where a job's pipeline stands. Pass `steps: { id, label, state, progress?, description? }[]` and change a step's `state` to move the run along.

  - It renders an `<ol>`, and every step's state is read in words (`stateLabels` translates them), so colour and glyph never carry it alone. The first running step gets `aria-current="step"` and a turning activity ring that holds still under reduced motion.
  - `progress` uses `Progress`'s 0 to 100 scale and draws a small bar under the step, green once it is done and red when it failed part-way.
  - State changes are spoken through a polite live region; turn it off with `announce={false}` or reword it with `formatAnnouncement`.
  - `orientation="horizontal"` (the default) falls back to a column when its container is narrower than 36rem; `orientation="vertical"` is always a column.
  - `onSelect` turns each label into a button, for opening a step's details.

- [#65](https://github.com/loidolt/loidolt-theme/pull/65) [`faf3870`](https://github.com/loidolt/loidolt-theme/commit/faf387081d52dade60eb56ff95d27ea95a94ed79) Thanks [@loidolt](https://github.com/loidolt)! - Add native file dialogs and window file drops to `@loidolt/theme-tauri`. Pass `@tauri-apps/plugin-dialog`, `@tauri-apps/plugin-fs` and `getCurrentWebview` from `@tauri-apps/api/webview` to `setupTauri`, then:

  - `desktop.files.pick({ accept, multiple })` opens the native open dialog, with `accept` turned into its filters, and resolves the chosen files as `File`s with their `path`, ready for the same upload code as a `Dropzone`. `pickPaths({ directory })` gives the paths unread, folders included. `save(file)` asks where with the native save dialog and writes the file there, resolving `{ method: 'filesystem', path }` or `{ method: 'cancelled' }`. In a browser the same calls use a file input and a download, like `createFiles` in `@loidolt/theme-capacitor`.
  - `fileDrop: { target: () => dropzone }` reads files dropped on the window (which a Tauri window takes before the page's own drop events) and delivers them into a `Dropzone` through `addFiles()`. `desktop.fileDrop.dragging` is reactive while files are over the window; `onFiles`, `onPaths` and `onError` are there for code of your own.

  Both are also exported on their own (`createDesktopFiles`, `createFileDrop`), with `acceptToFilters`, `readDesktopFiles` and `mimeTypeOf`. The README lists the capabilities to allow (`dialog:default`, `fs:allow-read-file`, `fs:allow-write-file`), how `dragDropEnabled` decides who gets a drop, and what to do with very large files.

  `Dropzone` gains `externalDragging`, which shows its window-drag overlay for a drag the page cannot see itself, such as one over a Tauri window.

- [#62](https://github.com/loidolt/loidolt-theme/pull/62) [`f1c68a4`](https://github.com/loidolt/loidolt-theme/commit/f1c68a438cbb394adb63794ca4016e95c586612f) Thanks [@loidolt](https://github.com/loidolt)! - `@loidolt/theme-tauri` now handles the window around the app. Pass `getCurrentWindow` from `@tauri-apps/api/window` (uncalled, so the layout stays browser-safe) and the app's `createTheme` store to `setupTauri`:

  ```ts
  setupTauri({ plugins: { window: getCurrentWindow }, theme, chrome: { titleBar: 'overlay' } });
  ```

  - The window background follows the page's live `background` colour through every theme and preset change, and its native light or dark appearance follows the theme, handing back to the OS for `system` (`syncWindowAppearance`).
  - No white flash on launch: start the window hidden (`"visible": false` in `tauri.conf.json`) with `windowBackground()` as its `backgroundColor`, and `setupTauri` shows it once the window has its colours and the fonts are in (`showWindow`). `desktop.ready` settles after that.
  - Under a macOS overlay title bar (`"titleBarStyle": "Overlay"`), `chrome: { titleBar: 'overlay' }` clears the window buttons through `--ldt-safe-top` (a 28px strip) or, with `trafficLights: 'beside'`, `--ldt-safe-left` on the top bar, and gives the room back in full screen (`insetWindowChrome`).

  The window calls need `core:window:allow-set-background-color`, `allow-set-theme`, `allow-show` and, for dragging, `allow-start-dragging` in the capability file; a refused call is swallowed.

  `Topbar` takes `dragRegion`, which sets `data-tauri-drag-region` on the bar and its regions so it drags a Tauri window like a title bar, while its buttons, links and fields stay clickable. A plain attribute everywhere else.

- [#52](https://github.com/loidolt/loidolt-theme/pull/52) [`f912288`](https://github.com/loidolt/loidolt-theme/commit/f912288a6453e5a2015a86bb2bf902c593a66ada) Thanks [@loidolt](https://github.com/loidolt)! - `Workspace` can now split its main pane and inspector with a draggable divider: set `resizable`. Drag it with a mouse, pen or finger, or focus it and use the keyboard: it is a `role="separator"` that Left/Right move (Shift for bigger steps), Home/End send to the limits and Enter collapses and restores. The size is the inspector's percentage of the width the two panes share. Bind it with `bind:inspectorSize` (default 30), bound it with `inspectorMinSize`/`inspectorMaxSize` (15 and 70), and set the arrow-key step with `resizeStep` (2). The divider reports the same percentages as `aria-valuenow`/`aria-valuemin`/`aria-valuemax`, names the inspector in `aria-controls`, and takes its accessible name from `resizeLabel` ('Resize inspector'). Pass a `storageKey` and the size is kept in `localStorage`; a server-rendered page restores it before first paint. Below the compact breakpoint the panes stack and the divider is hidden. Without `resizable`, `Workspace` renders exactly as before; with it, the inspector sits inside a `.ldt-workspace__inspector` wrapper.

### Patch Changes

- [#49](https://github.com/loidolt/loidolt-theme/pull/49) [`e8a4555`](https://github.com/loidolt/loidolt-theme/commit/e8a45557d45db822dec2ccc60becafd234b272a9) Thanks [@loidolt](https://github.com/loidolt)! - New package, `@loidolt/theme-capacitor`: adapters that carry the theme into Capacitor 8 iOS and Android apps. `setupCapacitor` wires them all in one call from the root layout, each turned on by the plugin you pass it, and every one is a no-op in a browser and on the server.

  - `syncNativeAppearance` styles the status and navigation bars from the live `surface` colour and gives the iOS keyboard the page's appearance, following every theme and preset change.
  - `handleBackButton` makes the Android back button close the open dialog, drawer, lightbox or menu before going back through history, then backgrounds the app.
  - `createNativeKeyboard` tracks the software keyboard, hides `TabBar` while typing, keeps the focused field in view, and lifts the bottom chrome above a keyboard that overlays the page.
  - `createHaptics` and `withHaptics` tick selection controls and give status toasts their notification pattern.
  - `persistTheme` backs `createTheme` with `Preferences`, so the choice survives iOS evicting `localStorage`.
  - `createAppLifecycle`, `handleDeepLinks`, `createNetworkStatus`, `openExternalLinks`, `hideSplashScreen`, `followSystemTextSize` and `bridgeClipboard` cover the rest of the app's native surface.
  - `@loidolt/theme-capacitor/styles.css` feeds the `--ldt-safe-*` knobs from Capacitor's injected safe-area variables, which older Android web views need, and `@loidolt/theme-capacitor/config` gives `capacitor.config.ts` the theme's launch colour and plugin defaults.

  `observeColorScheme` (and with it `createTokenColors`, charts and maps) now also hears `data-preset` changes, since a preset can recolour every role.

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`a35eb76`](https://github.com/loidolt/loidolt-theme/commit/a35eb762a4bfd8ada0c235a6d30459f0c31d3ae7) Thanks [@loidolt](https://github.com/loidolt)! - More phone polish. Topbar's actions sit beside the brand while they fit on a compact screen, instead of always taking a row of their own. On a phone, Slider and Progress put their readouts above the track, so the tracks keep the full width and line up; ImageViewer's fit buttons share out their row, and its zoom buttons are boxed; MarkdownPage's previous and next cards stack full width; and an empty chart's message no longer takes the chart's full height. Switch labels take the same face and size as checkbox and radio labels; SwatchGroup's swatches sit clear of their legend; in a CommentList with numbered comments an unnumbered reply lines up with their text; task-list boxes match their text; and footnote back-links and heading anchors take a 44px press on touch. HeatmapChart names the ends of its scale and sets cell values at 11px; TreemapChart names the first stop of its breadcrumb after the chart's title, which also gives it room to be pressed; a scrolling legend's page arrows are larger; and SankeyChart leaves room for the last node's label. CodeSnippet shows the language at the left of its copy bar when there is no filename.

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`157376e`](https://github.com/loidolt/loidolt-theme/commit/157376e13798aeed7d3d8307396054c6569c3818) Thanks [@loidolt](https://github.com/loidolt)! - Finish the phone pass. Pagination's page numbers wrap in a box of their own between Previous and Next, so a row just too narrow for the whole trail no longer leaves Next on a line by itself. On touch screens the Topbar brand, a DataTable row's checkbox, the rows-per-page and media speed selects, map legend and diagram source summaries, a chip's remove button outside MultiSelect, and the Combobox and PasswordInput buttons all take a 44px press, and a sort header's press fills its header cell instead of reaching into the first row. A Mermaid diagram or a horizontal Filmstrip that scrolls sideways shows a shadow on the side with more to see. At the largest iOS text sizes the page title stops growing at twice its size and the Topbar brand at one and a half times, so a title like "Pagination" stays whole and both leave room on the first screen, while body text keeps scaling. A disabled field keeps its muted text in iOS WebKit. Markdown code blocks without a filename show their language at the left of the copy bar, as CodeSnippet does.
- Updated dependencies [[`1b5678a`](https://github.com/loidolt/loidolt-theme/commit/1b5678aa6b552c96c3d74bd6f2cec0e97d81a625), [`a25b900`](https://github.com/loidolt/loidolt-theme/commit/a25b900a5e99317cf1034bc31772de2616f879b4), [`852d8b0`](https://github.com/loidolt/loidolt-theme/commit/852d8b0f38786067a643a8cf373db99edc4f3b3f), [`64f2b57`](https://github.com/loidolt/loidolt-theme/commit/64f2b577ac84803f8ffacc0fc328292b352b12ac), [`95f22c5`](https://github.com/loidolt/loidolt-theme/commit/95f22c5a29d10d0685e81515de36fbf7e5f9bede), [`a35eb76`](https://github.com/loidolt/loidolt-theme/commit/a35eb762a4bfd8ada0c235a6d30459f0c31d3ae7), [`157376e`](https://github.com/loidolt/loidolt-theme/commit/157376e13798aeed7d3d8307396054c6569c3818), [`16488e4`](https://github.com/loidolt/loidolt-theme/commit/16488e4f013e0a476bdc1481a6f4e82e31f4c536), [`4f60a5b`](https://github.com/loidolt/loidolt-theme/commit/4f60a5bf8f8ee0fe22d0b0af0034acc1b1311b31), [`254d271`](https://github.com/loidolt/loidolt-theme/commit/254d271a7da1763b98926da2c0c7662b0853c5f0), [`137b935`](https://github.com/loidolt/loidolt-theme/commit/137b93507673ad3ad1adaa2f9f01ceee7906747c), [`f912288`](https://github.com/loidolt/loidolt-theme/commit/f912288a6453e5a2015a86bb2bf902c593a66ada)]:
  - @loidolt/theme-styles@0.12.0
  - @loidolt/theme-tokens@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies [[`f13ecfe`](https://github.com/loidolt/loidolt-theme/commit/f13ecfeef6975180a5907abe239c1af615ded9c1)]:
  - @loidolt/theme-styles@0.11.1
  - @loidolt/theme-tokens@0.11.1

## 0.11.0

### Minor Changes

- [#29](https://github.com/loidolt/loidolt-theme/pull/29) [`215e78f`](https://github.com/loidolt/loidolt-theme/commit/215e78f4aff68f787514dd51eae6e45e5dff09b0) Thanks [@loidolt](https://github.com/loidolt)! - Safe-area support for apps that set `viewport-fit=cover` (Capacitor, home-screen web apps): `Topbar`, `AppShell`, `Drawer`, `ToastViewport` and `FloatingBar` now pad or offset themselves clear of the notch, rounded corners and home indicator with `env(safe-area-inset-*)`. The insets are 0 in desktop browsers and in pages without `viewport-fit=cover`, so existing layouts render exactly as before. Each edge reads a `--ldt-safe-top`/`-right`/`-bottom`/`-left` knob first, to opt an element out (`0px`) or preview an inset.

  New `TabBar`: bottom navigation for phones. It takes `TabBarItem`s (`label`, `href`, `current`, optional `icon` snippet) as real links with `aria-current="page"` on the current one, marks it with the `--loidolt-stroke-indicator` accent edge, gives every destination a 44px minimum target, and pads clear of the home indicator. `AppShell` gains a `tabBar` slot that pins it to the bottom of the screen.

### Patch Changes

- Updated dependencies [[`215e78f`](https://github.com/loidolt/loidolt-theme/commit/215e78f4aff68f787514dd51eae6e45e5dff09b0)]:
  - @loidolt/theme-styles@0.11.0
  - @loidolt/theme-tokens@0.11.0

## 0.10.1

### Patch Changes

- Updated dependencies [[`81b6f86`](https://github.com/loidolt/loidolt-theme/commit/81b6f86b7e881df6329ad7cd781cb77804348182)]:
  - @loidolt/theme-styles@0.10.1
  - @loidolt/theme-tokens@0.10.1

## 0.10.0

### Minor Changes

- [#24](https://github.com/loidolt/loidolt-theme/pull/24) [`97c0994`](https://github.com/loidolt/loidolt-theme/commit/97c099432ed2e2d4c1d3a7ad6a658be800fd05cd) Thanks [@loidolt](https://github.com/loidolt)! - Tabs gains a `rail` variant for settings sidebars, tab icons and descriptions, and a shared `panelHeader`.

  - `TabItem` extends `Option` with an `icon` snippet and a `description`, shown on hover and announced as the tab's description.
  - `variant="rail"`: icons above short labels in a narrow column beside panels that scroll on their own, or one row of equal tabs above the panels when `orientation` is horizontal. A vertical rail falls back to a row on phones, like vertical tabs.
  - `panelHeader` renders shared content once above the panels, such as a filter field, pinned while a vertical rail's panels scroll. `panelsClass` styles the element around the panels.
  - Documents that every panel stays mounted and hidden while unselected.

### Patch Changes

- Updated dependencies [[`97c0994`](https://github.com/loidolt/loidolt-theme/commit/97c099432ed2e2d4c1d3a7ad6a658be800fd05cd)]:
  - @loidolt/theme-styles@0.10.0
  - @loidolt/theme-tokens@0.10.0

## 0.9.1

### Patch Changes

- Updated dependencies []:
  - @loidolt/theme-styles@0.9.1
  - @loidolt/theme-tokens@0.9.1

## 0.9.0

### Patch Changes

- Updated dependencies [[`7eaa78f`](https://github.com/loidolt/loidolt-theme/commit/7eaa78f3cc29d60a643a14ee0fdbe290ca847f67)]:
  - @loidolt/theme-styles@0.9.0
  - @loidolt/theme-tokens@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies [[`a75bdb0`](https://github.com/loidolt/loidolt-theme/commit/a75bdb085edc9504cc1a422b9b7e1a904710e28a)]:
  - @loidolt/theme-styles@0.8.1
  - @loidolt/theme-tokens@0.8.1

## 0.8.0

### Minor Changes

- [#12](https://github.com/loidolt/loidolt-theme/pull/12) [`9673e33`](https://github.com/loidolt/loidolt-theme/commit/9673e33cc7b22cb4ff3a5ada2067785b08f191f4) Thanks [@loidolt](https://github.com/loidolt)! - Add style presets: named style sets that restyle colours for both schemes plus the corners,
  strokes, density and typographic voice of every component.

  - **Tokens.** A new shape-and-voice role tier (`--loidolt-radius-*`, `--loidolt-stroke-*`,
    `--loidolt-pad-*`, `--loidolt-gap-*`, `--loidolt-label-*`, `--loidolt-control-*`,
    `--loidolt-heading-weight`, `--loidolt-strong-weight`), exported as `roles`. New
    `definePreset()`, `generatePresetCss()`, `presetStylesheets()` and `auditContrast()`, and
    three built-in presets — `loidolt`, `soft` and `compact` — shipped as
    `@loidolt/theme-tokens/css/presets/*`.
  - **Styles.** Every component now reads padding, gaps, radius, strokes, tracking, weight and
    text case from those roles; the default look is unchanged, pixel for pixel. Preset
    stylesheets are re-exported as `@loidolt/theme-styles/presets/*`.
  - **Svelte.** `createTheme()` and `themeScript()` take `presets` (plus `defaultPreset`,
    `presetStorageKey`, `presetAttribute`) and manage `data-preset` alongside `data-theme`. New
    `PresetPicker` component. `ToggleGroup` now keeps its pressed item in sync with a parent that
    rejects a change.

  Two behaviour changes to note:

  - Overriding `--loidolt-border-radius` now rounds surfaces and overlays as well as buttons,
    because every radius role defaults to it.
  - `.ldt-theme` now also sets `font-family: var(--loidolt-font-display)`.

### Patch Changes

- Updated dependencies [[`9673e33`](https://github.com/loidolt/loidolt-theme/commit/9673e33cc7b22cb4ff3a5ada2067785b08f191f4)]:
  - @loidolt/theme-tokens@0.8.0
  - @loidolt/theme-styles@0.8.0

## 0.7.0

### Minor Changes

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - Add data-visualisation and basemap colour tokens, and a way to use tokens on a canvas.

  - Tokens: eight categorical chart colours (`--loidolt-chart-1`…`-8`), sequential and diverging ramps, gain/loss colours and `--loidolt-map-*` basemap roles, each with a dark value and checked for contrast in both themes. `roleVar`, `roleValue`, `resolveRoles`, `chartRoles`/`mapRoles` and `chartColors()`/`mapColors()` resolve them in JavaScript. A trailing number in a token name is now its own segment (`chart1` → `--loidolt-chart-1`); no existing name changes.
  - Svelte: `createTokenColors()` reads semantic roles off the page as hex for canvas and WebGL renderers and follows theme changes; `readRoleColor`, `colorSchemeOf`, `observeColorScheme` and `normalizeColor` are the pieces it is built from.
  - Styles: a `loidolt.vendor` cascade layer between `base` and `components` for third-party stylesheets a loidolt package ships with.

### Patch Changes

- Updated dependencies [[`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b)]:
  - @loidolt/theme-tokens@0.7.0
  - @loidolt/theme-styles@0.7.0

## 0.6.0

### Minor Changes

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add behaviour helpers for custom surfaces, a live region, and a skip link.

  - **Attachments.** `escapeKey`, `clickOutside`, `autofocus`, `rovingFocus` and `focusTrap` give
    markup you build yourself the keyboard and focus contract the library's own overlays and groups
    already have. They are Svelte attachments, so they never run during SSR.
  - **`createAnnouncer()` and `LiveRegion`.** Speak status changes without moving focus. The
    announcer empties the region between messages, so a repeated message is still announced, and
    clears stale text after `clearAfter`.
  - **`SkipLink`** jumps keyboard users past repeated navigation. It also moves focus to the
    target, so the next Tab continues from the content.
  - **`describedBy(...ids)`** builds an `aria-describedby` value, or `undefined` when there are no
    ids. `Field` and `Fieldset` now use it.
  - **Tokens:** WCAG contrast helpers (`getContrastRatio`, `meetsContrast`, `validateContrast`,
    `getContrastTextColor`) and named `aspectRatio` frames, emitted as `--loidolt-aspect-*`.
  - **Styles:** `.ldt-sr-only-focusable`, `.ldt-touch-target-expand`, `.ldt-line-clamp` (with
    `--ldt-lines`), and `.ldt-print-visible`.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add `Combobox`, `MultiSelect`, `Slider`, `PasswordInput`, `OTPInput` and `Avatar`.

  - **`Combobox` / `MultiSelect`:** searchable choice over `Option`s or labelled `OptionGroup`s.
    - Filtering ignores case and accents by default. `filter={false}` plus a debounced
      `onQueryChange` hands the search to a server.
    - The result count is announced through a live region that stays mounted.
    - `MultiSelect` shows picks as removable square `.ldt-chip`s, honours `max`, and removes the
      last pick on Backspace.
  - **`Slider`:** one value or a range (pass an array), with `formatValue` driving
    `aria-valuetext`. `onValueCommit` fires only when the user settles on a value. Thumbs use
    exact positioning, so the server render never shifts on hydration.
  - **`PasswordInput`:** the reveal button keeps one name and reports its state with
    `aria-pressed`.
  - **`OTPInput`:** built on Bits' PinInput. One real input handles paste, SMS autofill and
    assistive tech. Spaces and dashes are removed from pasted codes, and `groupSize` adds visual
    gaps.
  - **`Avatar`:** a photo, falling back to initials, with one stable accessible name.

  The Bits `Avatar`, `Combobox`, `PinInput` and `Slider` namespaces are re-exported as
  `*Primitive`. New shared types are `OptionGroup` and `ChoiceOption`.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Extend existing components with capabilities ported from classic-theme.

  - **`DropdownMenu`:** `items` also takes `group`, `checkbox`, `radio` and `sub` entries (headings,
    toggles, one-of-many choices, nested menus), reported through the new `onCheckedChange` and
    `onValueChange` callbacks.
    - Items gain `destructive` and `shortcut`. `shortcut` sets `aria-keyshortcuts` and is shown as
      the hint.
    - `items` is now typed `MenuEntry[]`. Existing `MenuItem[]` arrays still type-check.
  - **Toaster:**
    - `ToastOptions.action` adds one follow-up button.
    - `toaster.update(id, patch)` changes a toast in place.
    - `success`/`info`/`warning`/`error` are shortcuts, and `error` stays until dismissed by
      default.
    - `Toast` renders the action or an `actions` snippet, and no longer leaks `duration` as an
      attribute when spread from the queue. `ToastViewport` takes a `position`.
  - **`Select`:** `{ label, options }` entries render as native `<optgroup>`s.
  - **`Dialog`:** a `header` snippet (the title stays the accessible name), `headerActions`, and
    `size="full"`.
  - **`Badge`:** `count` with `max`, a visually hidden `label`, a `live` mode, and a leading `dot`.
    `children` is now optional.
  - **`RadioGroup`:** per-option `description`, linked through `aria-describedby`.
  - **`NumberField`:** `nullable` (clearing yields `null`), `readonly` that also locks the
    steppers, and `hideSteppers`.
  - **`Tooltip`:** `arrow`.
  - **`Progress`:** status `variant`, `size`, and `showValue` with `formatValue`, which also drives
    `aria-valuetext`.
  - **`Skeleton`:** shape variants (`text` with `lines`, `title`, `avatar`, `button`, `card`).
  - **`Spinner`:** `size`.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add `DataTable`, `DataTableSearch`, `DataTableFacetedFilter`, `DataTableColumnVisibility` and
  `DataTablePagination`, rendering `createDataTable()` state with the existing `Table`,
  `TableHeader`, `Pagination`, `Checkbox`, `DropdownMenu` and `EmptyState`.

  - **Rows:** paged or virtual tables report `aria-rowcount` and `aria-rowindex`. Rows can be
    selected by checkbox (with an indeterminate select-all) or by radio.
  - **Cells:** editable cells are buttons that become fields, where Enter saves and Escape restores.
    `hideBelow` drops columns on narrow screens.
  - **States:** loading placeholders and an empty state are built in.
  - **Filters:** the faceted filter shows counts and supports true multi-value filtering. The
    search re-syncs when the table is reset.
  - **Footer:** the pagination footer announces the visible range.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add `createDataTable()`, a runes engine for table state: sorting, global search, column
  filters, paging, row selection and column visibility over an array.

  - **Built for the existing parts.** `sortOf(id)` feeds `TableHeader`'s `sort` prop and `page` is
    1-based for `Pagination`.
  - **Server data.** `manual: { sorting, filtering, pagination }` plus `rowCount` hand each step
    to a server, and every change is reported through a callback.
  - **Filters.** A text filter matches as a substring. A list of values matches by set
    membership, so multi-value faceted filters work (classic-theme's comma-joined matching did
    not). `facets(id)` counts each value among the rows passing every _other_ filter.
  - **Sort order.** Numbers, dates, then natural text ("Sheet 2" before "Sheet 10"), with empty
    values last in either direction.
  - **Anywhere.** State is set synchronously, so it works during SSR and at module scope.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add `Toolbar`, `FilterPanel` and `ActiveFilterChips` for filterable lists.

  - **`Toolbar`:** a labelled row of list controls with an `end` cluster, on the recessed surface.
    `roving` turns it into an ARIA `toolbar` with a single tab stop.
  - **`FilterPanel`:** expands under a consumer-owned toggle and lays filters out on an auto-fit
    grid. Collapsed controls are `inert`, so they leave the tab order while the height still
    animates. Offers "Clear all" when filters are active.
  - **`ActiveFilterChips`:** one removable square chip per active filter. Focus stays in the group
    as chips are removed.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add `MediaGrid`, `Lightbox` and `MediaCarousel` for collections of images, video, audio and
  embeds.

  - **`MediaGrid`:** one tab stop with arrow-key movement. Tiles name their media kind, the grid
    can be laid out as masonry, and it opens a `Lightbox` on the pressed item.
  - **`Lightbox`:** a full-screen dialog.
    - Keyboard and swipe navigation.
    - Zoom and pan from `createMediaZoom()`.
    - Preloads the neighbouring items, and has a filmstrip of thumbnails.
    - Announces each move once, and offers a download link for images.
  - **`MediaCarousel`:** follows the WAI-ARIA carousel pattern.
    - Slides are named groups. The live region is polite when the user drives it and off while it
      autoplays.
    - Autoplay pauses on hover and focus, and has a visible pause button.
    - It starts paused under `prefers-reduced-motion`.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add media: `VideoPlayer`, `AudioPlayer`, `MediaEmbed` and `AspectRatio`, with upgrades to
  `Thumbnail`.

  - **Players:** controls in this system's language on the inverse surface, all built from native
    elements.
    - The seek bar speaks positions as words.
    - Shortcuts: Space/K play, arrows seek and change volume, M mutes, F goes full screen,
      C toggles captions.
    - Captions, speed, picture-in-picture and full screen.
  - **HLS:** plays natively in Safari, and elsewhere through hls.js, now an **optional** peer
    dependency registered with `setHlsLoader()`.
  - **`MediaEmbed`:** YouTube and Vimeo behind a click-to-load facade using their no-tracking
    hosts. It fetches no provider thumbnail unless you pass one. Unlike classic-theme, it puts
    Vimeo's start time in the URL fragment where Vimeo reads it.
  - **Engines:** `createMediaPlayer()`, `createHlsSource()` and `createMediaZoom()` for your own
    media UI, plus `formatDuration`, `formatDurationSpoken`, `parseEmbedUrl`, `buildEmbedSrc`,
    `inferMediaKind` and related helpers.
  - **`Thumbnail`:** takes named `ratio`s, `srcset`/`sizes`, `loading`, a `fallback` for failed
    images and an `overlay`. It shimmers while loading and reports `data-status`.

- [#8](https://github.com/loidolt/loidolt-theme/pull/8) [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3) Thanks [@loidolt](https://github.com/loidolt)! - Add `SignaturePad`: draw a signature with a mouse, pen or finger, or type a name as the
  keyboard-accessible alternative.

  - **Output:** both modes produce a PNG. Drawn signatures also keep their strokes and an SVG, and
    `name` submits the PNG with a form.
  - **Validation:** a length check keeps a stray dot from counting as a signature.
  - **Styling:** the ink follows the theme, and the canvas is sized to the device's pixel ratio.
  - **Helpers:** the pure `strokeLength`, `strokePath`, `strokesToSvg` and `validateSignature`
    are exported for server-side checks.
  - **Left out from classic-theme:** Google Fonts injection, `userAgent` capture and the built-in
    consent checkbox.

### Patch Changes

- Updated dependencies [[`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3), [`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3)]:
  - @loidolt/theme-tokens@0.6.0
  - @loidolt/theme-styles@0.6.0

## 0.5.0

### Minor Changes

- [#6](https://github.com/loidolt/loidolt-theme/pull/6) [`1029b55`](https://github.com/loidolt/loidolt-theme/commit/1029b550c9fbca6834f6c028c2abf73ab9f4aa02) Thanks [@loidolt](https://github.com/loidolt)! - Add `.ldt-prose` long-form content styles (headings, lists and GFM task lists, blockquotes, inline and block code, tables, `details`) with a zero-specificity `.ldt-not-prose` opt-out and `--ldt-prose-size` / `--ldt-prose-width` knobs. Also ships the accessibility remediation for `Dialog`, `AlertDialog`, `Drawer`, `AppShell`, `ToastViewport` and the toaster that landed after 0.4.0.

### Patch Changes

- Updated dependencies [[`1029b55`](https://github.com/loidolt/loidolt-theme/commit/1029b550c9fbca6834f6c028c2abf73ab9f4aa02)]:
  - @loidolt/theme-tokens@0.5.0
  - @loidolt/theme-styles@0.5.0

## 0.4.0

### Minor Changes

- [`31648e2`](https://github.com/loidolt/loidolt-theme/commit/31648e2feb3e5ae257a4219e318e2c594fa9e56d) Thanks [@loidolt](https://github.com/loidolt)! - Replace the segmented `ThemeToggle` picker with a compact icon button that cycles through light,
  dark, and system preferences. The button exposes its current preference through its accessible
  name and tooltip, keeps localised labels and sizing, and still supports a light/dark-only cycle.

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Card accepts `href` and renders the whole card as one block-level link (`.ldt-card--link`, hover accent border). The content region is now always full width — a behavioral CSS change that only affects cards whose root was externally turned into a centering flex/grid container, which previously collapsed intrinsic-less content (viewBox-only SVGs) to its fallback size.

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Thirteen new components for review and dashboard surfaces: Thumbnail (framed media box on a sunken or paper surface), CommentList, CodeBlock (select-all + copy), StatusDot, Marker (dot/pin), RecordStepper, FloatingBar, Filmstrip, ListRow, FileInput, SwatchGroup, Stat, and SegmentedNav (a segmented control of real links). New `--loidolt-surface-paper` token stays white in both themes so artwork previews read true.

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Dialog, AlertDialog, Drawer, and Popover accept `triggerVariant` and `triggerSize`, composing the default trigger's button classes instead of consumers hand-assembling `ldt-button …` strings. An explicit `triggerClass` still wins wholesale; Popover keeps its quiet default.

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Workspace gains a `header` snippet — a full-width row above the panes for a ContextBar or toolbar — and a `mainClass` prop so consumers stop reaching into `.ldt-workspace__main` from outside.

### Patch Changes

- [`31648e2`](https://github.com/loidolt/loidolt-theme/commit/31648e2feb3e5ae257a4219e318e2c594fa9e56d) Thanks [@loidolt](https://github.com/loidolt)! - Harden inline theme bootstrapping, toaster lifecycle and validation, dynamic tabs, switch form
  resets, and AppShell landmark composition. Relax package-only Node engine restrictions and add
  package-local documentation.

  Split component CSS into maintainable domain files without changing its public entry point, and
  add coverage, catalog-integrity, package, and real-browser accessibility verification.

- Updated dependencies [[`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8), [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8), [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8), [`31648e2`](https://github.com/loidolt/loidolt-theme/commit/31648e2feb3e5ae257a4219e318e2c594fa9e56d), [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8)]:
  - @loidolt/theme-styles@0.4.0
  - @loidolt/theme-tokens@0.4.0

## 0.3.0

### Minor Changes

- [#2](https://github.com/loidolt/loidolt-theme/pull/2) [`99e8d91`](https://github.com/loidolt/loidolt-theme/commit/99e8d91dcd7cf265c11a9a71705ed1ddbd52e5f4) Thanks [@loidolt](https://github.com/loidolt)! - Foundation review hardening.

  Tokens:

  - Added `dangerHover` semantic role (light `#7f1f1a`, dark `#e07a70`), asserted at WCAG AA against `onDanger` in both themes.
  - Removed the unused `--loidolt-border-color` primitive (and `borders.color`): it duplicated `--loidolt-border` but was never overridden by the dark theme, so any consumer reaching for it would get a light-theme border stuck in dark mode. Use `--loidolt-border` instead.
  - New test guarantees the generated CSS never emits a `var()` reference to an undeclared token.

  Styles:

  - Fixed three selectors that used pseudo-elements inside `:where()`, which is invalid and silently dropped: the `box-sizing` reset and the reduced-motion rule now reach `::before`/`::after`, and the branded `::selection` colors actually apply.
  - The reduced-motion rule also zeroes `animation-delay`/`transition-delay`.
  - `.ldt-button--danger` keeps its danger fill on hover (previously flipped to the neutral inverse surface).
  - Disabled menu items no longer show the interactive hover highlight.
  - Added a `./fonts` export so deep-slice consumers can load the `@font-face` rules without the full bundle.

  Svelte:

  - `Button` no longer uses native `disabled` for the `loading` state, so keyboard focus is not dropped mid-interaction; explicit `disabled` keeps native semantics. The default variant no longer emits a dead `ldt-button--default` class (same for `IconButton`).
  - `NumberField` now disables its spin buttons together with the input, chains a consumer `onchange` instead of dropping it, and treats a cleared field as the documented low-bound fallback instead of clamping `Number('')` (0).
  - `createToaster` tracks remaining time per toast, fixing pause/resume corruption when toasts were pushed at different moments; a toast that expires while paused now dismisses right after resume.

  Second pass (API and infrastructure):

  - `Button` and `Brand` props are now discriminated on `href`: button-only attributes on an anchor (and vice versa) are a type error instead of silently rendered junk.
  - `Alert` `title` is optional and accepts a snippet for rich headings; body-only alerts no longer need a dummy heading.
  - `Tabs` defaults its `value` at destructure time instead of in an `$effect` (SSR output and first client frame now agree with a bound parent), falls back to the first tab when the selected tab is removed, and forwards rest attributes; `NavMenu` forwards rest attributes to its trigger.
  - `DropdownMenu` item hints are exposed to assistive tech (styled via the new `ldt-menu__hint` class) instead of being `aria-hidden`.
  - New `borderSunken` semantic token for decorative rules on the sunken surface, with a dark value — the catalog's canvas grid now adapts to dark mode.
  - Publishing: `prepack` scripts on the tokens and svelte packages guard against packing a stale `dist`; the catalog consumes the packages via `^0.1.0` ranges like a real consumer; README font-preload example is bundler-aware.
  - Tests: server-render sweep over every exported component (new SSR vitest project), keyboard navigation for Tabs and DropdownMenu, first NavMenu coverage, axe over an open dropdown menu and popover, standalone axe cases for the layout components, and a full-barrel export parity check.

  Badge sizing:

  - Badges are now unmistakably inert next to controls. Previously a `.ldt-badge` was a square, stroked box with the same type as `.ldt-button`, so at a matched height the two were told apart only on hover. A badge now carries the pill silhouette (new `--loidolt-border-radius-pill` token — the system stays square everywhere else, which is what makes the shape read), a recessed `--loidolt-surface-sunken` fill instead of a raised one, the wider `--loidolt-font-tracking-wide` label tracking, and type that stays one step under button type at every size. `textMuted` over `surfaceSunken` is now asserted at WCAG AA in both themes.
  - `Badge` takes a `size` prop (`inline | sm | md | lg`, new `BadgeSize` type). It defaults to `inline`, which keeps today's compact chip metrics for table cells and running copy; the `sm`/`md`/`lg` steps match `.ldt-button--sm` / `.ldt-button` / `.ldt-button--lg`, so a badge placed in a cluster of controls lines up with them instead of rendering at roughly half their height. The catalog's action rows (`Export` / `Cancel` / `Live`, and the overlay demo's selected-action badge) now pass `size="md"`.

- [#2](https://github.com/loidolt/loidolt-theme/pull/2) [`9160f7d`](https://github.com/loidolt/loidolt-theme/commit/9160f7d46aaaa658599d9ad2a782516de1da8864) Thanks [@loidolt](https://github.com/loidolt)! - Close the gaps an application hits in its first week: a theme runtime, a responsive story, a
  table that can actually list data, and the components every product screen needs.

  **Theme runtime**

  - `createTheme()` holds the colour-scheme preference (`light` / `dark` / `system`), resolves it
    against `prefers-color-scheme`, writes the result to `data-theme`, persists it, and mirrors
    the choice across tabs. Callable at module scope for one app-wide instance.
  - `themeScript()` returns the blocking `<head>` snippet that performs the same resolve before
    first paint, so a reload no longer flashes light.
  - `ThemeToggle` is the ready-made segmented picker wired to a theme.
  - The **resolved** scheme is always written, even for `system`, so one store drives both
    `@loidolt/theme-styles/dark` and `/dark-auto`.

  **Responsive**

  - `createMediaQuery()` and `breakpointQuery()` make the token breakpoints reactive in Svelte.
  - The breakpoint scale grows to `compact` / `expanded` / `wide`. Only `compact` is used by the
    package's own CSS, as before.
  - `Drawer` is the edge-anchored modal panel a sidebar becomes on a narrow viewport.
  - `Workspace` takes `sidebarOpen` and `inspectorOpen`, collapsing a pane by leaving it
    unrendered rather than hidden, so nothing collapsed stays in the tab order.

  **Data**

  - `Table` gains `sticky` (with `--ldt-table-height`), an `empty` snippet with `columns`, and
    `data-align` support on cells.
  - `TableHeader` is a sortable `<th>`: `aria-sort` on the cell, a real button inside it, and a
    drawn indicator with no icon dependency.
  - `EmptyState` covers the "nothing here yet" case, in or out of a table.

  **Components**

  - `Accordion`, `AlertDialog`, `Breadcrumbs`, `Fieldset`, `Pagination`, and `ToggleGroup`.
  - `AlertDialog` closes on confirm (`open` is bindable for callers awaiting async work) and
    offers no dismiss affordance beyond its two answers.
  - `ToggleGroup` corrects the root role to `radiogroup` in single mode, where the primitive
    leaves radios inside a plain group.
  - New primitives re-exported: `AccordionPrimitive`, `AlertDialogPrimitive`,
    `PaginationPrimitive`, `ToggleGroupPrimitive`.
  - New types: `ColumnAlign`, `Crumb`, `Disclosure`, `SortDirection`.

### Patch Changes

- Updated dependencies [[`99e8d91`](https://github.com/loidolt/loidolt-theme/commit/99e8d91dcd7cf265c11a9a71705ed1ddbd52e5f4), [`9160f7d`](https://github.com/loidolt/loidolt-theme/commit/9160f7d46aaaa658599d9ad2a782516de1da8864)]:
  - @loidolt/theme-tokens@0.3.0
  - @loidolt/theme-styles@0.3.0

## 0.2.0

### Minor Changes

- [`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631) Thanks [@loidolt](https://github.com/loidolt)! - Settle the component API before v1: typed props, one callback convention, and Bits UI wrappers
  that can be opened up instead of forked.

  **Breaking**

  - Rest props are typed against `svelte/elements` (`HTMLButtonAttributes`, `HTMLInputAttributes`,
    …) instead of `[key: string]: unknown`, so attribute and event typos are now compile errors.
  - One change-callback convention, camelCase so it can never shadow a forwarded DOM handler:
    `onValueChange`, `onCheckedChange`, `onOpenChange`, `onSelect`, `onDismiss`. Replaces
    `oninput`/`onchange`/`onselect`/`ondismiss` with non-DOM signatures.
  - `TextButton` is folded into `Button variant="text"`.
  - `DropdownMenu`'s group-heading prop is renamed `label` → `groupLabel`, so `label` means one
    thing across the library.
  - `Select` binds to `T | ''` and its placeholder is selectable again unless the field is
    `required`; `Progress` treats `value={undefined}` as indeterminate.
  - `Card` renders a `<div>` by default (`as` to change it), and `Sidebar`'s `label` no longer
    defaults to `"Sidebar"`, which only repeated the role.
  - Badge gains an `info` variant and Toast gains the status variants, so both draw from the same
    status set as `Alert`.
  - The peer range rises to `svelte@^5.33.0`, which Bits UI 2 already required.

  **Added**

  - `ref` is `$bindable` on every component.
  - `triggerChild` on `Dialog`, `Popover`, `DropdownMenu`, and `Tooltip` exposes Bits UI's `child`
    snippet, so a consumer supplies the trigger element rather than nesting one inside ours.
    `triggerClass` covers the simpler case; `sideOffset`/`side`/`align` are no longer hardcoded;
    rest props reach the portaled Content (`id`, `data-*`, `trapFocus`, `interactOutsideBehavior`,
    `escapeKeydownBehavior`, `onOpenAutoFocus`, …).
  - `DropdownMenu` takes a `children` snippet in place of `items`, supports links, icons, hints,
    and separators, wraps its heading in a real menu group, and its `open` is bindable. The Bits
    namespaces are re-exported (`DialogPrimitive`, `DropdownMenuPrimitive`, `PopoverPrimitive`,
    `TabsPrimitive`, `TooltipPrimitive`) for anything the declarative API does not model.
  - `TooltipProvider` for app-level skip-delay grouping; a standalone `Tooltip` still works.
  - `createToaster()` — queue, auto-dismiss, and pause/resume that preserves the remaining time.
  - `headingLevel` on `Alert`, `Card`, `Dialog`, `PageHeader`, `Panel`, and `Section`.
  - Second-element class props: `inputClass`, `wrapperClass`, `triggerClass`, `overlayClass`,
    `listClass`, `contentClass`, `menuClass`.
  - `orientation` on `Separator` and `RadioGroup`; `boxed` on `NumberField`; `size`/`variant` on
    `IconButton`; `name`/`value` form participation on `Switch`; numeric `width`/`height` on
    `Skeleton`; overridable `optionalText`, `loadingLabel`, `navLabel`, `politeness`,
    `decrementLabel`/`incrementLabel`.

  **Fixed**

  - SSR: ids come from `$props.id()` instead of `Math.random()`. `Field` labels and `RadioGroup`
    names no longer mismatch between server and client, which had been splitting radio groups in
    two before hydration.
  - `Workspace` only claims the sidebar column when a `sidebar` snippet is present; without one,
    main content was rendered into a 17rem fixed column.
  - `NumberField` clears to the low bound instead of wedging on `NaN`, and omits `min="-Infinity"`
    / `max="Infinity"` from the DOM. Its spin buttons stay focusable at the bounds.
  - `Switch` and `NumberField` spread rest props _before_ their internal handlers, so a
    consumer-supplied `onclick`/`onchange` no longer silently replaces toggling and clamping.
  - `Tabs` defaults to the first tab, so a panel always renders.
  - `Tooltip` no longer forces `aria-label={content}` onto its trigger, which clobbered the
    trigger's own accessible name and defeated Bits' `aria-describedby`.
  - `Table`'s scroll region is keyboard-reachable (`tabindex="0"`) and its wrapper is addressable.
  - `Progress` clamps `aria-valuenow`, survives a non-positive `max`, and supports indeterminate.
  - `ToastViewport` is the only live region; `Toast` dropped its nested `role="status"` (which
    caused double announcements), moved the dismiss control after the content, and gave it
    ghost/small styling.
  - `NavMenu`'s active state is styled, sets `aria-current`, and lands on the trigger rather than
    the popup.
  - `Button`'s loading live region is mounted persistently so it actually announces; `Input` drops
    a no-op handler that duplicated `bind:value`; `AppShell` wraps the header snippet in
    `<header>`; `Label` gets its own `ldt-label` class; `ContextBar` actions get
    `ldt-contextbar__actions`.

### Patch Changes

- [`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631) Thanks [@loidolt](https://github.com/loidolt)! - Fix a set of layout, contrast and target-size defects found by measuring the rendered catalog at
  320–1440px in both themes, and ship a tested dark theme.

  **Fixed**

  - `.ldt-app-shell` had no explicit grid column, so the implicit content-sized one let a wide
    topbar stretch the whole page into horizontal scroll. Capped at `minmax(0, 1fr)`.
  - `.ldt-topbar__nav` could not shrink (no `min-width: 0`) and pushed the layout wider than the
    viewport. It now shrinks and scrolls, and `.ldt-topbar` wraps at whatever width runs out of
    room instead of only at the compact breakpoint.
  - Form-control boundaries failed WCAG 1.4.11: `--loidolt-border` on an input was 1.45:1 against
    paper, well under the required 3:1. Controls now use a new `--loidolt-border-control` role
    (light `#847d6a`, dark `#787c6b`); decorative hairlines keep the quieter `--loidolt-border`.
  - `Field`'s error text used `--loidolt-danger`, a _fill_ colour tuned to carry white ink, as
    text on a surface. Added `--loidolt-text-danger` (plus `text-success`, `text-warning`,
    `text-info`) and used it.
  - `.ldt-choice`, `.ldt-switch` and `.ldt-button--text` were 22–23px tall, under the WCAG 2.2
    SC 2.5.8 minimum of 24×24. All three now reserve `min-height: 1.5rem`.
  - Surfaces that paint a background now also declare `color`. `color` inherits as a computed
    value, so a subtree redefining `--loidolt-text` previously kept the outer ink and produced
    unreadable panels; scoped theming now works on `.ldt-card`, `.ldt-panel`, `.ldt-table`,
    `.ldt-topbar`, `.ldt-contextbar`, `.ldt-sidebar`, `.ldt-dialog`, `.ldt-menu`, `.ldt-popover`,
    `.ldt-toast`, `.ldt-alert` and `.ldt-app-shell`.
  - A focus ring inside a scroll container was clipped by the container's own edge. Elements
    inside `.ldt-topbar__nav`, `.ldt-table-wrap`, `.ldt-sidebar` and `.ldt-dialog__body` now draw
    the same 2px indicator inset.

  **Added**

  - A dark theme: `@loidolt/theme-styles/dark` (activated by `data-theme="dark"`) and
    `@loidolt/theme-styles/dark-auto` (also follows `prefers-color-scheme`, while still honouring
    an explicit `data-theme="light"`). Exported from tokens as `darkSemantic` and
    `generateDarkCss()`. Every text pair and control boundary in it is asserted at WCAG AA — the
    `on-*` inks in particular, since lightened status colours need _dark_ ink and pairing them
    with white is the easiest dark-theme mistake to make.
  - `.ldt-theme` utility for theming an arbitrary subtree.

  - `Tabs` accepted `orientation="vertical"` but shipped no styles for it, so the prop changed
    keyboard behaviour and nothing else. Vertical layout now keys off the `data-orientation`
    attribute Bits already stamps on the root, list, triggers and panels.

  **Performance**

  - `Progress` animates a composited `transform: scaleX()` instead of `width`, which relayouts on
    every frame. The bar reads its fraction from `--ldt-progress-value`.

- Updated dependencies [[`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631), [`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631)]:
  - @loidolt/theme-tokens@0.2.0
  - @loidolt/theme-styles@0.2.0
