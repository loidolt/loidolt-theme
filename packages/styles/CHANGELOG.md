# @loidolt/theme-styles

## 0.9.0

### Minor Changes

- [#19](https://github.com/loidolt/loidolt-theme/pull/19) [`7eaa78f`](https://github.com/loidolt/loidolt-theme/commit/7eaa78f3cc29d60a643a14ee0fdbe290ca847f67) Thanks [@loidolt](https://github.com/loidolt)! - Add `@loidolt/theme-styles/core`: the whole stylesheet without the styles for media, charts, maps, long-form prose and docs, for apps that use only the Svelte components. Each component stylesheet is also published as `@loidolt/theme-styles/components/<name>`, so an app can add one extra back inside the components layer. `index.css` is now `core.css` plus those extras, so the full stylesheet is unchanged.

### Patch Changes

- Updated dependencies []:
  - @loidolt/theme-tokens@0.9.0

## 0.8.1

### Patch Changes

- [#17](https://github.com/loidolt/loidolt-theme/pull/17) [`a75bdb0`](https://github.com/loidolt/loidolt-theme/commit/a75bdb085edc9504cc1a422b9b7e1a904710e28a) Thanks [@loidolt](https://github.com/loidolt)! - Keep a dialog's actions in reach on short screens. `.ldt-dialog` is now a flex column whose body alone shrinks and scrolls; before, a tall body pushed the footer (and its Save or Confirm button) below the dialog's max height, where `overflow: hidden` clipped it out of reach. The `--full` size and an `AlertDialog` without content (no body) lay out the same way.

- Updated dependencies []:
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

## 0.7.0

### Minor Changes

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - Add data-visualisation and basemap colour tokens, and a way to use tokens on a canvas.

  - Tokens: eight categorical chart colours (`--loidolt-chart-1`…`-8`), sequential and diverging ramps, gain/loss colours and `--loidolt-map-*` basemap roles, each with a dark value and checked for contrast in both themes. `roleVar`, `roleValue`, `resolveRoles`, `chartRoles`/`mapRoles` and `chartColors()`/`mapColors()` resolve them in JavaScript. A trailing number in a token name is now its own segment (`chart1` → `--loidolt-chart-1`); no existing name changes.
  - Svelte: `createTokenColors()` reads semantic roles off the page as hex for canvas and WebGL renderers and follows theme changes; `readRoleColor`, `colorSchemeOf`, `observeColorScheme` and `normalizeColor` are the pieces it is built from.
  - Styles: a `loidolt.vendor` cascade layer between `base` and `components` for third-party stylesheets a loidolt package ships with.

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - New package: `@loidolt/theme-charts`, accessible ECharts charts painted from the tokens.

  - `LineChart` (with `area`), `BarChart`, `PieChart` (with `innerRadius` for a donut), `FunnelChart`, `ScatterChart`, `RadarChart`, `GaugeChart`, `HeatmapChart`, `TreemapChart`, `CandlestickChart` and `SankeyChart`, all built on `Chart`, which themes any ECharts option.
  - Every chart is a captioned `<figure>` with a generated plain-language description and its data as a real table — for assistive tech by default, or behind a "Show data table" button. `decal` patterns series; animation follows `prefers-reduced-motion`.
  - Colours are read live off the page, so light, dark and custom themes reach the canvas, and a theme change recolours in place. Updates replace the option, so removed series leave the chart.
  - ECharts is a peer, loaded in the browser only; each chart registers just the pieces it draws with. The server renders the caption, description and table.
  - `@loidolt/theme-charts/core` holds the option builders, describers, table helpers, `applyTheme` and locale-aware formatters as plain TypeScript.
  - Styles: chart frame styles in `@loidolt/theme-styles`.

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - New package: `@loidolt/theme-docs`, accessible Markdown documentation in the loidolt look.

  - `Markdown`, `MarkdownPage`, `CodeSnippet`, `MermaidDiagram`, `TableOfContents`, `TocPanel`, `DocsHub` and `DocsCard`.
  - `renderMarkdown` / `renderMarkdownSync` (in `@loidolt/theme-docs/core` too): GFM plus frontmatter, admonitions and GitHub alerts, footnotes, definition lists, filenames on code, and Mermaid fences; a table of contents with de-duplicated heading ids. Safe for untrusted markdown by default — raw HTML is shown as text and URLs are allow-listed — with `allowHtml` and a `sanitize` hook for trusted content.
  - Server-rendered first; Shiki highlighting and Mermaid diagrams are optional peers, registered with `setHighlighterLoader` and `setMermaidLoader`, and follow the theme.
  - Tokens: `--loidolt-syntax-*` colours for code on the inverse surface, each held to 4.5:1 in both themes, with `syntaxRoles` and `syntaxColors()`.
  - Styles: code frames, admonitions, footnotes, diagrams, contents, page layout and docs index in `@loidolt/theme-styles`.

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - Map extras: layer management, deck.gl, routing and large-data helpers.

  - `LayerManager`: show, fade and reorder a map's layers from a map control; reorder with buttons or Alt + ↑/↓, each move announced and focus kept on the moved layer.
  - `DeckOverlay`: deck.gl layers over the map (or interleaved with its own, where deck.gl supports the MapLibre major). deck.gl is an optional peer, registered with `setDeckLoader`.
  - Routing: `haversine`, `pathLength`, `distanceMatrix`, `optimizeRoute` (nearest neighbour then 2-opt), `measureRoute`, and Google and Apple Maps directions links, split into legs for long routes.
  - Large data: `createSpatialIndex` (R-tree search and nearest), `simplifyLine`/`simplifyFeatures`, `convexHull`, `createLevelOfDetail`, `outlineOf`, and `createSpatialWorker`, which does the indexing and simplification in a web worker (shipped as `@loidolt/theme-maps/spatial.worker`) with a main-thread fallback.

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - New package: `@loidolt/theme-maps`, accessible MapLibre maps painted from the tokens.

  - `MapView` draws a quiet basemap in the loidolt palette from OpenFreeMap's free OpenMapTiles tiles (or any OpenMapTiles-schema tiles, or a style of your own), repaints it in place on a theme change, and binds `center`/`zoom` both ways. `basemap="blank"` needs no network.
  - `MapSource` and seven layers (`FillLayer`, `LineLayer`, `CircleLayer`, `SymbolLayer`, `FillExtrusionLayer`, `HeatmapLayer`, `RasterLayer`) with themed default paint, paint functions that follow the theme, and diffed updates.
  - `MapMarker` (the loidolt pin as a named button, with an optional popup that takes and returns focus), `MapPopup`, `MapControl`, `MapLegend`, `MapLegendGroup`, `CoordinateDisplay`, `BasemapSwitcher`, and `MapFeatureList` — every place as a list, the non-visual way around the map.
  - The canvas is named and described, keyboard moves are announced, and a browser without WebGL gets a message. MapLibre loads in the browser only.
  - `@loidolt/theme-maps/core`: style generators, bounds, GeoJSON validation and loading, coordinate/distance/area formatting, cluster helpers.
  - Styles: map, control, popup, marker, legend and feature-list styles in `@loidolt/theme-styles`, with MapLibre's control icons redrawn to follow the theme.

### Patch Changes

- Updated dependencies [[`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b)]:
  - @loidolt/theme-tokens@0.7.0

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

- Updated dependencies [[`5d4c90a`](https://github.com/loidolt/loidolt-theme/commit/5d4c90a4f613da0138a5558f14687559885de8a3)]:
  - @loidolt/theme-tokens@0.6.0

## 0.5.0

### Minor Changes

- [#6](https://github.com/loidolt/loidolt-theme/pull/6) [`1029b55`](https://github.com/loidolt/loidolt-theme/commit/1029b550c9fbca6834f6c028c2abf73ab9f4aa02) Thanks [@loidolt](https://github.com/loidolt)! - Add `.ldt-prose` long-form content styles (headings, lists and GFM task lists, blockquotes, inline and block code, tables, `details`) with a zero-specificity `.ldt-not-prose` opt-out and `--ldt-prose-size` / `--ldt-prose-width` knobs. Also ships the accessibility remediation for `Dialog`, `AlertDialog`, `Drawer`, `AppShell`, `ToastViewport` and the toaster that landed after 0.4.0.

### Patch Changes

- Updated dependencies [[`1029b55`](https://github.com/loidolt/loidolt-theme/commit/1029b550c9fbca6834f6c028c2abf73ab9f4aa02)]:
  - @loidolt/theme-tokens@0.5.0

## 0.4.0

### Minor Changes

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Card accepts `href` and renders the whole card as one block-level link (`.ldt-card--link`, hover accent border). The content region is now always full width — a behavioral CSS change that only affects cards whose root was externally turned into a centering flex/grid container, which previously collapsed intrinsic-less content (viewBox-only SVGs) to its fallback size.

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - New utility and component classes: `.ldt-cluster--between` / `.ldt-cluster--end` alignment modifiers, `.ldt-muted` (muted body voice for meta lines), `.ldt-topbar__link` (topbar nav link with `aria-current` underline), and `.ldt-table__actions` (trailing table action cell).

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Thirteen new components for review and dashboard surfaces: Thumbnail (framed media box on a sunken or paper surface), CommentList, CodeBlock (select-all + copy), StatusDot, Marker (dot/pin), RecordStepper, FloatingBar, Filmstrip, ListRow, FileInput, SwatchGroup, Stat, and SegmentedNav (a segmented control of real links). New `--loidolt-surface-paper` token stays white in both themes so artwork previews read true.

- [`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8) Thanks [@loidolt](https://github.com/loidolt)! - Workspace gains a `header` snippet — a full-width row above the panes for a ContextBar or toolbar — and a `mainClass` prop so consumers stop reaching into `.ldt-workspace__main` from outside.

### Patch Changes

- [`31648e2`](https://github.com/loidolt/loidolt-theme/commit/31648e2feb3e5ae257a4219e318e2c594fa9e56d) Thanks [@loidolt](https://github.com/loidolt)! - Harden inline theme bootstrapping, toaster lifecycle and validation, dynamic tabs, switch form
  resets, and AppShell landmark composition. Relax package-only Node engine restrictions and add
  package-local documentation.

  Split component CSS into maintainable domain files without changing its public entry point, and
  add coverage, catalog-integrity, package, and real-browser accessibility verification.

- Updated dependencies [[`62305ae`](https://github.com/loidolt/loidolt-theme/commit/62305ae65328caa27e0ab2346d2d770c4dc4d4d8), [`31648e2`](https://github.com/loidolt/loidolt-theme/commit/31648e2feb3e5ae257a4219e318e2c594fa9e56d)]:
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

## 0.2.0

### Minor Changes

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

- [`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631) Thanks [@loidolt](https://github.com/loidolt)! - Rebuild the token layer around a real semantic tier, and fix the generator that silently broke
  every line-height.

  **Breaking**

  - The CSS variable generator now kebab-cases the whole token path, not just the leaf. Anything
    reading `--loidolt-font-lineHeight-*` must switch to `--loidolt-font-line-height-*`. The
    stylesheets already referenced the correct names, so tokenized line-heights were quietly
    falling back to `normal` in every consuming app.
  - The five ad-hoc aliases are replaced by a full semantic tier defined in `src/index.ts`:
    `--loidolt-foreground` → `--loidolt-text`, `--loidolt-primary` → `--loidolt-accent`, plus
    `surface`, `surface-alt`, `surface-sunken`, `surface-inverse`, `surface-input`, `text-muted`,
    `text-inverse`, `text-accent`, `border-soft`, `border-strong`, `accent-hover`, `on-accent`,
    `danger`, `success`, `warning`, `info` (each with an `on-*` counterpart), `focus-ring`,
    `shadow-color`, and `scrim`. `components.css` now consumes only these, so overriding the
    semantic tier restyles the system — dark mode included — without touching component props.
  - Token-to-token links emit `var()` references instead of resolved values, so overriding
    `--loidolt-color-line` now propagates to `--loidolt-border-color`.
  - `shadows` values reference `--loidolt-shadow-color` rather than baking in an rgb literal.
  - `colors.orange` darkens marginally to `#c65224` and `colors.muted`, `success`, `warning`, and
    `info` darken so every text/background pair in the system clears WCAG AA at small sizes;
    `typography.size.xs` grows from `0.625rem` to `0.6875rem` for the same reason.
  - `accessibility.css` is imported into a new final `loidolt.a11y` layer, and its reduced-motion
    block drops `!important` — inside a layer that beat an app's own `!important`, making a
    deliberate animation impossible to opt back into.
  - Fonts ship as WOFF2 only (~30% smaller); the WOFF1 files are gone. `font-synthesis: none` and
    `text-rendering: optimizeLegibility` are removed from `base.css`, so `<strong>` and `<em>`
    render as emphasis again. `html { font-size }` is `100%` rather than a hardcoded `16px`, and
    `100vh` becomes `100dvh`.

  **Added**

  - `zIndex` and `breakpoints` token groups; the magic z-index numbers in `components.css` are now
    `--loidolt-z-*`.
  - `semantic` export with resolved values, plus `flattenTokens()`, `generateCss()`, and
    `cssVarName()` for tooling.
  - `require('@loidolt/theme-tokens')` resolves — the `.` export was missing a `default` condition.
  - `@loidolt/theme-styles/tokens` slice and a `style` field for tooling that ignores `exports`.

  **Fixed**

  - The tokens test no longer reads `dist/`, so `npm test` works on a fresh clone. New tests assert
    key parity, unique names, no camelCase leakage, WCAG AA contrast, and — the check that would
    have caught the line-height bug — that every `var(--loidolt-*)` in the stylesheets resolves and
    that `components.css` never reaches past the semantic tier.

### Patch Changes

- Updated dependencies [[`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631), [`6707023`](https://github.com/loidolt/loidolt-theme/commit/670702310fa0b3da40b3fccf32cb195a02ff8631)]:
  - @loidolt/theme-tokens@0.2.0
