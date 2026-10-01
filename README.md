# Loidolt Theme

A shared, Svelte-first design system for Loidolt applications. It packages the warm workshop
language established in Topostack and Label Studio: paper and panel surfaces, precise borders,
orange actions, Jost display type, and Archivo utility text.

The library is intentionally light-first, Tailwind-free, and free of authentication or
application-domain code.

**Documentation: [theme.loidolt.space](https://theme.loidolt.space)** — a live example, the
accessibility contract, and a generated prop table for every component.

## Packages

| Package                 | Purpose                                                                                                               |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `@loidolt/theme-tokens` | Typed colour, typography, spacing, sizing, border, shadow, z-index, and motion values plus generated CSS variables    |
| `@loidolt/theme-styles` | Bundled fonts, base styles, accessibility helpers, component classes, and layout utilities                            |
| `@loidolt/theme-svelte` | Accessible Svelte 5 controls, overlays, feedback, surfaces, and application layouts                                   |
| `@loidolt/theme-charts` | Accessible ECharts charts painted from the tokens, each with a data-table alternative ([README](packages/charts))     |
| `@loidolt/theme-maps`   | Accessible MapLibre maps on a token-coloured basemap, with keyboard markers and layer tools ([README](packages/maps)) |
| `@loidolt/theme-docs`   | Safe, server-rendered Markdown documentation: pages, contents, highlighted code, diagrams ([README](packages/docs))   |

The last three are optional. Each has its own heavy peer (`echarts`, `maplibre-gl`, and optionally
`shiki`/`mermaid`), so an app that draws no charts never installs ECharts. All six are released
together on one version.

## Requirements

- **Node** 22 or newer (for development; the published packages are plain ESM).
- **Svelte** 5.33 or newer — `$props.id()` and the Bits UI 2 peer range both need it.
- A bundler that understands `exports` maps and CSS `@import` with `@layer` (Vite 5+, or any
  modern equivalent).

## Install

```sh
npm install @loidolt/theme-svelte
```

Import the global foundation once in the application stylesheet:

```css
@import '@loidolt/theme-svelte/styles.css';
```

Then import components normally:

```svelte
<script lang="ts">
  import { Button, Field, Input } from '@loidolt/theme-svelte';

  let name = $state('');
</script>

<Field label="Project name">
  {#snippet children({ id, describedBy, invalid })}
    <Input {id} bind:value={name} aria-describedby={describedBy} aria-invalid={invalid} boxed />
  {/snippet}
</Field>
<Button variant="primary">Create project</Button>
```

Tokens and styles may be installed independently:

```ts
import { colors, semantic, spacing, typography } from '@loidolt/theme-tokens';
```

```css
@import '@loidolt/theme-styles';
```

`@loidolt/theme-styles` also exposes slices — `/tokens`, `/base`, `/accessibility`,
`/components`, `/utilities`. Every slice except `/tokens` reads the token custom properties, so
import `/tokens` (or the whole package) first.

### Fonts

Both faces are WOFF2 and are referenced by `fonts.css`. To remove the flash of fallback text,
preload them. With a bundler (Vite, webpack), import the file so the href matches the hashed
URL the bundler gives the font in production — a hardcoded `/node_modules/...` path only works
in dev:

```svelte
<script>
  import jostUrl from '@loidolt/theme-styles/fonts/Jost-Medium.woff2';
</script>

<svelte:head>
  <link rel="preload" as="font" type="font/woff2" crossorigin href={jostUrl} />
</svelte:head>
```

Only one weight per family ships (Jost 500, Archivo 400). `font-synthesis` is left at its
browser default so `<strong>` and `<em>` still read as emphasis.

### Server-side rendering

Every component is SSR-safe: ids come from Svelte's `$props.id()`, so markup rendered on the
server matches the client and hydration never re-labels a control. Nothing touches `window`,
`document`, or `Math.random()` during render.

## Customization

### Two variable prefixes

| Prefix        | Meaning                                                                                                                                                                                                                    |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--loidolt-*` | The public token contract. Primitives (`--loidolt-color-*`), colour roles (`--loidolt-surface`) and shape/voice roles (`--loidolt-radius-control`). Override these to theme the system.                                    |
| `--ldt-*`     | Per-component knobs read at a single call site — `--ldt-dialog-width`, `--ldt-sidebar-width`, `--ldt-inspector-width`, `--ldt-gap`, `--ldt-min`, `--ldt-prose-size`. Set them inline or on a wrapper to tune one instance. |

### Tokens have three tiers

Primitives hold the raw palette and scales. Two **role** tiers name the job a value does, and they
are what the stylesheets read. The colour roles:

`--loidolt-background`, `--loidolt-surface`, `--loidolt-surface-alt`, `--loidolt-surface-sunken`,
`--loidolt-surface-inverse`, `--loidolt-surface-input`, `--loidolt-text`, `--loidolt-text-muted`,
`--loidolt-text-inverse`, `--loidolt-text-accent`, `--loidolt-border`, `--loidolt-border-soft`,
`--loidolt-border-strong`, `--loidolt-border-control`, `--loidolt-accent`,
`--loidolt-accent-hover`, `--loidolt-on-accent`, `--loidolt-focus-ring`,
`--loidolt-shadow-color`, `--loidolt-scrim`, and the four status families
(`danger`, `success`, `warning`, `info`).

Two distinctions are load-bearing, and getting them wrong is the usual source of unreadable
themes:

| Pair                                       | Meaning                                                                                                                                        |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `--loidolt-danger` / `--loidolt-on-danger` | A **fill** and the ink that sits on it.                                                                                                        |
| `--loidolt-text-danger`                    | The same status used as **text on a surface**.                                                                                                 |
| `--loidolt-border`                         | Decorative hairlines (cards, tables, dividers).                                                                                                |
| `--loidolt-border-control`                 | The boundary of an input, select, textarea or switch — held to 3:1 (WCAG 1.4.11) because the border is the only thing identifying the control. |

A fill tuned for white ink is too light to read as text, and a hairline tuned to be quiet is too
faint to outline a field. The token tests assert every one of these pairs, in both themes.

The **shape and voice** roles do the same for everything that is not colour:

| Group   | Roles                                                                                                                                                                                                   |
| ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Radius  | `radius-control`, `radius-inner`, `radius-surface`, `radius-overlay` — all `0` by default, linked to `--loidolt-border-radius`                                                                          |
| Stroke  | `stroke-focus` (2px, never less), `stroke-indicator` (selected tabs, active nav), `stroke-accent` (the status bar on alerts and toasts)                                                                 |
| Density | `pad-control-x`/`-y` (+ `-sm`, `-lg`), `pad-field`, `pad-item`, `pad-cell`, `pad-callout`, `pad-surface`, `pad-overlay`, `pad-popover`, `pad-bar-x`, `pad-pane`, `pad-page`, `gap-field`, `gap-actions` |
| Voice   | `label-transform`, `label-tracking`, `label-tracking-wide`, `label-weight`, `control-transform`, `control-tracking`, `control-weight`, `heading-weight`, `strong-weight`                                |

A test holds the stylesheets to this: every padding, gap, radius, stroke, tracking, weight and
case in `@loidolt/theme-styles` reads a token, or carries an `@literal` comment saying why it is
geometry rather than style.

### Dark mode

A tested dark theme ships with the package — every pair in it is asserted at WCAG AA, so you do
not have to get the `on-*` inks right yourself:

```css
@import '@loidolt/theme-styles';
@import '@loidolt/theme-styles/dark'; /* [data-theme="dark"] */
/* or */
@import '@loidolt/theme-styles/dark-auto'; /* also follows prefers-color-scheme */
```

Then set `data-theme="dark"` on `<html>`. It redefines only the semantic tier — no component
class or prop changes.

`createTheme()` is the runtime that sets that attribute — see [Colour scheme](#colour-scheme).

To adjust it, redefine the same roles in your own stylesheet. To ship a different look
altogether — with its own light _and_ dark side — define a [preset](#presets) instead.

```css
[data-theme='dark'] {
  color-scheme: dark;
  --loidolt-background: #161814;
  --loidolt-surface: #1e211c;
  --loidolt-text: #ebe7dc;
  --loidolt-border: #3a3d34;
  --loidolt-accent: #e0672f;
  --loidolt-on-accent: #161814;
}
```

### Theming part of a page

`color` inherits as a _computed_ value, so redefining `--loidolt-text` partway down the tree
does nothing on its own — something inside the scope has to re-declare it. Every surface in the
library does (`.ldt-card`, `.ldt-panel`, `.ldt-table`, `.ldt-topbar`, …), so scoped overrides
work out of the box. For your own wrapper, use `.ldt-theme`:

```html
<div class="ldt-theme" style="--loidolt-surface: #10212c; --loidolt-text: #dceaf2">
  <!-- components here render in the scoped palette -->
</div>
```

Overriding a primitive works too, and propagates: semantic tokens link to primitives with
`var()` rather than baking in resolved values.

```css
:root {
  --loidolt-color-orange: #b4471f;
  --loidolt-size-sidebar: 19rem;
  --loidolt-font-size-base: 0.9375rem;
}
```

`.ldt-theme` also re-declares `font-family`, which `<html>` otherwise sets once, so a subtree
preset that changes the display face reaches running text.

The catalog ships a live example of both (a dark-mode switch and a side-by-side override panel).

### Cascade layers

Styles are published in `@layer loidolt.tokens, loidolt.reset, loidolt.base, loidolt.vendor,
loidolt.components, loidolt.utilities, loidolt.a11y`. Unlayered application CSS outranks all of
them, so plain selectors in your app always win — no `!important` needed. `loidolt.reset` is
deliberately empty and reserved for an app's own reset. `loidolt.vendor` holds third-party CSS a
loidolt package ships with (MapLibre's, for `@loidolt/theme-maps`), so our component styles can
restyle it.

## Presets

A preset is a complete, named style set: colours for both schemes, plus the corners, strokes,
density and typographic voice of every component. Presets and colour schemes are independent
axes — `data-preset` and `data-theme` — so every preset has a tested light and dark side.

| Preset    | Look                                                                                                |
| --------- | --------------------------------------------------------------------------------------------------- |
| `loidolt` | The base system: square corners, tracked uppercase labels, warm paper and orange.                   |
| `soft`    | Rounded corners, sentence-case labels, system type, cool neutrals and a blue accent; a bit roomier. |
| `compact` | The Loidolt look with three-quarter padding and smaller controls, for data-dense tools.             |

Every built-in preset is asserted at WCAG AA in both schemes, by the same pairs as the base theme.

### Using presets

Import each preset you offer, with the same dark flavour you use for the base theme:

```css
@import '@loidolt/theme-styles';
@import '@loidolt/theme-styles/dark';
@import '@loidolt/theme-styles/presets/soft';
@import '@loidolt/theme-styles/presets/soft-dark'; /* or soft-dark-auto, to match dark-auto */
@import '@loidolt/theme-styles/presets/compact';
@import '@loidolt/theme-styles/presets/compact-dark';
```

Then put `data-preset="soft"` on `<html>` — or on any element, to restyle just that subtree. To
switch at runtime, give the names to `createTheme()` and `themeScript()`; the preset is stored
under its own key and restored before first paint like the scheme:

```ts
// src/lib/theme.ts
export const presets = ['loidolt', 'soft', 'compact'] as const;
export const theme = createTheme({ presets });

// src/hooks.server.ts
html.replace('%theme%', themeScript({ presets }));
```

```svelte
<PresetPicker {theme} variant="select" />
<ThemeToggle {theme} />
```

`theme.preset` is assignable and ignores names outside `presets`. Without `presets`,
`createTheme()` never touches `data-preset`, so a static attribute in your markup keeps working.

An app that only ever uses one preset can skip the attribute and import the `:root` build instead:
`@loidolt/theme-tokens/css/presets/soft.root` (plus `soft.root-dark` or `soft.root-dark-auto`).

**How they cascade.** Preset stylesheets are unlayered and ordered by specificity, not import
order, against the base tokens and dark theme. A nested preset replaces the outer one completely
rather than blending with it. A preset whose dark stylesheet you did not import falls back to the
base dark colours while keeping its own shape. To tweak a built-in preset, `extends` it (below)
rather than overriding its custom properties by hand.

### Defining your own

The built-in presets are written with the same public API:

```ts
import { auditContrast, definePreset, presetStylesheets, soft } from '@loidolt/theme-tokens';

export const studio = definePreset({
  name: 'studio',
  extends: soft, // optional: start from another preset instead of the base system
  density: 0.9, // scales every pad-* and gap-* role this definition does not set
  primitives: { typography: { display: '"Inter", system-ui, sans-serif' } },
  roles: { radiusControl: '4px', labelTransform: 'uppercase' },
  colors: {
    light: { accent: '#0b6bcb', accentHover: '#0956a3', focusRing: '#0b6bcb' },
    dark: { accent: '#5aa7f0', accentHover: '#7ab8f3', focusRing: '#7ab8f3' },
  },
  fontImport: 'https://fonts.example/inter.css', // optional, @imported ahead of the preset
});

// At build time: studio.css, studio-dark.css, studio-dark-auto.css, and the same with .root
for (const [file, css] of Object.entries(presetStylesheets(studio))) {
  await writeFile(`static/presets/${file}`, css);
}

// In a test: every pair the stylesheets draw, at WCAG AA
expect(auditContrast(studio.resolved.dark).filter((check) => !check.pass)).toEqual([]);
```

Whatever a preset leaves out comes from the base system or the preset it extends. `dark` must
restate every colour role `light` changes — TypeScript enforces it, and so does `definePreset` at
runtime — and colours are set only through roles, never colour primitives, which is what keeps
subtree presets correct. `generatePresetCss(preset, { scope, scheme })` emits a single block if
you would rather assemble the files yourself.

## Colour scheme

`createTheme()` holds the preference, resolves it against `prefers-color-scheme`, writes the
result to `data-theme`, persists it, and mirrors the choice across tabs. It is callable at module
scope, which is where an app-wide instance belongs:

```ts
// src/lib/theme.ts
import { createTheme } from '@loidolt/theme-svelte';

export const theme = createTheme();
```

```svelte
<script lang="ts">
  import { ThemeToggle } from '@loidolt/theme-svelte';
  import { theme } from '$lib/theme.js';
</script>

<ThemeToggle {theme} />
<!-- or drive it yourself -->
<button onclick={theme.toggle}>{theme.resolved === 'dark' ? 'Light' : 'Dark'} mode</button>
```

`ThemeToggle` is a single icon button that cycles light, dark, then system. Its accessible name
and native tooltip report the active preference; set `showSystem={false}` for a two-scheme cycle.

The **resolved** scheme is always written out, even while the preference is `system`, so one
store drives both `/dark` and `/dark-auto`: an explicit `data-theme="light"` is exactly what
`dark-auto` needs to see when a user overrides a dark system.

### No flash on reload

A store created during hydration is too late to paint the first frame. `themeScript()` returns
the blocking `<head>` snippet that performs the same resolve before the browser paints. It has to
run **synchronously in `<head>`** — a module script, a deferred script, or anything in `<body>`
is too late by definition. The output contains no `<`, so it needs no escaping.

```html
<!-- src/app.html -->
<head>
  %sveltekit.head%
  <script>
    %loidolt.theme%
  </script>
</head>
```

```ts
// src/hooks.server.ts
import { themeScript } from '@loidolt/theme-svelte';

export const handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%loidolt.theme%', themeScript()),
  });
```

Both take the same options (`storageKey`, `attribute`, `defaultPreference`, `defaultScheme`), and
they must agree: the script decides the first paint, the store decides everything after it.

### Colours for canvas and WebGL

Charts and maps paint on a canvas, which cannot read `var()`. `createTokenColors()` reads
semantic roles off the page as concrete hex values — so an app's own theme reaches the canvas —
and follows every theme change, bumping `version` when the colours actually change:

```ts
import { createTokenColors } from '@loidolt/theme-svelte';
import { chartRoles } from '@loidolt/theme-tokens';

const palette = createTokenColors(chartRoles, { element: () => node });
// palette.colors.categorical → ['#c65224', '#2f6f8a', …] in light, the dark set in dark
```

Pass the element you paint into, so a scoped `data-theme` subtree is honoured. On the server,
and anywhere the page cannot be read, it falls back to the reference light or dark values
(`chartColors()`, `mapColors()` and `roleValue()` in `@loidolt/theme-tokens` give the same
values without a DOM).

The tokens include eight categorical series colours (`--loidolt-chart-1` … `-8`), a five-step
sequential ramp, a seven-step diverging ramp centred on a neutral, gain/loss colours and the
basemap roles (`--loidolt-map-*`). Each is checked in both themes: every series holds 3:1
against every surface and stays visibly distinct from the others, and map labels hold 4.5:1.

## Responsive layout

Breakpoints are tokens (`compact` 760px, `expanded` 1024px, `wide` 1400px) but not custom
properties, because `@media` cannot read `var()`. `breakpointQuery()` turns one into a query and
`createMediaQuery()` makes it reactive:

```svelte
<script lang="ts">
  import {
    breakpointQuery,
    createMediaQuery,
    Drawer,
    Sidebar,
    Workspace,
  } from '@loidolt/theme-svelte';

  const compact = createMediaQuery(breakpointQuery('compact'));
  let navOpen = $state(false);
</script>

{#if compact.matches}
  <Drawer title="Navigation" bind:open={navOpen}>
    {#snippet trigger()}Menu{/snippet}
    {@render nav()}
  </Drawer>
{/if}

<Workspace sidebarOpen={!compact.matches}>
  {#snippet sidebar()}<Sidebar label="Navigation">{@render nav()}</Sidebar>{/snippet}
  <main>...</main>
</Workspace>
```

A query created inside a component unsubscribes with it; one created at module scope is yours to
`destroy()`. On the server `matches` is the `fallback` and nothing subscribes, so markup that
switches on a query hydrates with the fallback branch and swaps on the first client frame.

`Workspace` collapses a pane by leaving it unrendered rather than hiding it, so nothing inside a
collapsed pane stays in the tab order.

`Workspace` also responds to its available container width when it is directly inside
`AppShell`. For a standalone or deeply nested workspace, put `ldt-workspace-container` on its
nearest sizing wrapper; the panes stack when that wrapper is 760px or narrower. The viewport media
query remains as a fallback for existing markup.

On coarse-pointer devices, interactive components expand to 44px touch targets while mouse and
keyboard layouts retain the compact density shown by the size tokens.

## Data tables

`Table` owns the scroll region, the caption, and the states around the rows; `TableHeader` is a
`<th>` that can sort. `aria-sort` sits on the cell, where the spec puts it, while the press target
is a real button inside it.

```svelte
{#snippet nothingYet()}
  <EmptyState title="No cut files yet" description="Import a drawing to get started." />
{/snippet}

<Table caption="Cut files" sticky columns={2} empty={rows.length === 0 ? nothingYet : undefined}>
  <thead>
    <tr>
      <TableHeader sort={sortOf('name')} onSort={(direction) => sortBy('name', direction)}>
        Name
      </TableHeader>
      <TableHeader align="end">Sheets</TableHeader>
    </tr>
  </thead>
  <tbody>
    {#each rows as row (row.name)}
      <tr><td>{row.name}</td><td data-align="end">{row.sheets}</td></tr>
    {/each}
  </tbody>
</Table>
```

`sticky` needs a bounded scroll container — set `--ldt-table-height` on the wrapper, or the page
scrolls and nothing sticks. Exactly one column should report a sort; leave the rest at `none`.
Pass `empty` only when there are no rows, since the component cannot see inside `children` to
count them.

### Data-driven tables

`createDataTable()` holds the state — sorting, search, column filters, paging, selection and
column visibility — and `DataTable` with its companions renders it:

```svelte
<script lang="ts">
  import {
    createDataTable,
    DataTable,
    DataTableFacetedFilter,
    DataTablePagination,
    DataTableSearch,
    Toolbar,
  } from '@loidolt/theme-svelte';

  let { sheets } = $props();

  const table = createDataTable({
    get data() {
      return sheets;
    },
    columns: [
      { id: 'name', header: 'Name', sortable: true },
      { id: 'stock', header: 'Stock' },
      { id: 'layers', header: 'Layers', sortable: true, align: 'end' },
    ],
    getRowId: (sheet) => sheet.id,
    pageSize: 25,
    selection: 'multiple',
  });
</script>

<Toolbar label="Sheet tools">
  <DataTableSearch {table} />
  <DataTableFacetedFilter {table} column="stock" />
</Toolbar>
<DataTable {table} caption="Cut sheets" />
<DataTablePagination {table} />
```

The engine is independent of the component: `table.sortOf(id)` feeds `TableHeader`, `table.page`
feeds `Pagination`, and `table.rows` is the page to render if you build the markup yourself. For
server data, set `manual: { sorting, filtering, pagination }` and `rowCount`, and fetch in
`onSortChange`, `onSearchChange`, `onFiltersChange` and `onPageChange`.

## Long-form content

Rendered Markdown, documentation and help text get their typography from one class:

```svelte
<article class="ldt-prose" style="--ldt-prose-size: 0.9375rem">
  {@html renderedMarkdown}
  <div class="ldt-not-prose">…ordinary UI inside the article…</div>
</article>
```

`.ldt-prose` styles headings, lists (including GFM task lists), blockquotes, inline and block
code, tables, images, `details`, and rules, using only semantic tokens, so it follows dark mode.
Every rule weighs zero specificity: a component class inside prose (`.ldt-button`,
`.ldt-card`, `.ldt-table`) always wins, and `.ldt-not-prose` is only needed for bare elements
that should read as UI rather than content. Code blocks keep a background written inline by a
highlighter such as Shiki. `--ldt-prose-size` scales the text and `--ldt-prose-width` caps the
measure.

## Charts, maps and documentation

These live in their own packages, and each README covers it in full. In short:

```svelte
<script lang="ts">
  import { LineChart } from '@loidolt/theme-charts';
  import { MapView, MapMarker } from '@loidolt/theme-maps';
  import { Markdown } from '@loidolt/theme-docs';
</script>

<LineChart title="Sheets per month" {data} dataTable="toggle" />

<MapView label="Workshop" center={[-122.66, 45.51]} zoom={13}>
  <MapMarker lngLat={[-122.66, 45.51]} label="Workshop" />
</MapView>

<Markdown source={guide} />
```

- **[`@loidolt/theme-charts`](packages/charts)** — `LineChart`, `BarChart`, `PieChart`,
  `ScatterChart`, `RadarChart`, `FunnelChart`, `GaugeChart`, `HeatmapChart`, `TreemapChart`,
  `CandlestickChart`, `SankeyChart`, and `Chart` for any ECharts option. Every chart is a named
  figure with a generated description and its data as a real table. The chart colours
  (`--loidolt-chart-*`) are read live, so a theme change recolours the chart in place.
- **[`@loidolt/theme-maps`](packages/maps)** — `MapView`, `MapSource`, seven layer types,
  `MapMarker` (a named button), `MapPopup`, legends, `BasemapSwitcher`, `MapFeatureList`,
  `LayerManager` and `DeckOverlay`. The default basemap draws
  [OpenFreeMap](https://openfreemap.org) vector tiles in the `--loidolt-map-*` colours;
  `basemap="blank"` needs no network. `@loidolt/theme-maps/core` adds routing, distance,
  spatial-index and level-of-detail helpers that run anywhere, including a worker. Import
  `@loidolt/theme-maps/styles.css` next to the theme stylesheet.
- **[`@loidolt/theme-docs`](packages/docs)** — `Markdown`, `MarkdownPage`, `CodeSnippet`,
  `MermaidDiagram`, `TableOfContents`, `TocPanel`, `DocsHub` and `DocsCard`, over
  `renderMarkdown` (also in `@loidolt/theme-docs/core` for a `load`). Raw HTML is escaped and
  URLs are allow-listed unless you opt in. Shiki highlighting follows the
  `--loidolt-syntax-*` tokens.

## Components

- Actions: `Button` (`variant="text"` covers the former `TextButton`), `IconButton`, `ToggleGroup`, `ListRow`
- Forms: `Field`, `Fieldset`, `Label`, `Input`, `Textarea`, `NumberField`, `Select`, `Combobox`, `MultiSelect`, `Slider`, `PasswordInput`, `OTPInput`, `SignaturePad`, `Checkbox`, `RadioGroup`, `Switch`, `FileInput`, `SwatchGroup`
- Surfaces: `Card`, `Panel`, `Section`, `PageHeader`, `Separator`, `Thumbnail`, `Stat`, `Avatar`, `Badge`
- Data: `Table`, `TableHeader`, `EmptyState`, `Pagination`, `DataTable`, `DataTableSearch`, `DataTableFacetedFilter`, `DataTableColumnVisibility`, `DataTablePagination`, `ActiveFilterChips`, `CodeBlock`, `CommentList`, `RecordStepper`, `Filmstrip`
- Feedback: `Alert`, `Toast`, `ToastViewport`, `Progress`, `Spinner`, `Skeleton`, `StatusDot`, `LiveRegion`, `Marker`
- Overlays: `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `DropdownMenu`, `Tooltip`, `TooltipProvider`
- Navigation: `Topbar`, `Brand`, `NavMenu`, `SkipLink`, `Breadcrumbs`, `SegmentedNav`, `Tabs`, `Accordion`, `ContextBar`
- Layout: `AppShell`, `Workspace`, `Sidebar`, `FloatingBar`, `AspectRatio`, `Toolbar`, `FilterPanel`
- Media: `VideoPlayer`, `AudioPlayer`, `MediaEmbed`, `MediaGrid`, `Lightbox`, `MediaCarousel`
- Theme: `PresetPicker`, `ThemeToggle`

Complex focus, portal, dismissal, and keyboard behavior is powered by Bits UI. Icons remain
consumer-supplied through snippets, so the theme does not impose an icon library.

### Shared conventions

- **Change callbacks** are camelCase and cannot collide with a forwarded DOM handler:
  `onValueChange`, `onCheckedChange`, `onOpenChange`, `onSelect`, `onDismiss`. A native
  `oninput` / `onchange` / `onclick` passed through the rest props still fires as well.
- **`ref`** is `$bindable` on every component, so `bind:ref` hands back the underlying DOM node.
- **Rest props** are typed against `svelte/elements`, so attribute typos are compile errors.
- **`class`** lands on the root element. Where a component owns more than one element it also
  takes a second prop: `inputClass` (Checkbox, NumberField), `wrapperClass` (Table),
  `triggerClass` / `overlayClass` / `listClass` / `contentClass` / `menuClass` (overlays and
  Tabs). On the overlay wrappers `class` targets the portaled content, not the trigger.
- **Wrapper escape hatches**: `triggerChild` gives you Bits UI's `child` snippet, so you can
  render your own trigger element instead of nesting one inside ours. `DropdownMenu` also takes
  a `children` snippet in place of `items`, and the raw Bits namespaces are re-exported
  (`DialogPrimitive`, `DropdownMenuPrimitive`, `PopoverPrimitive`, `TabsPrimitive`,
  `TooltipPrimitive`) for anything the declarative API does not model.
- **Vocabulary**: actions use `default | primary | quiet | danger | ghost | text`; status uses
  `info | success | warning | error`; sizes are `sm | md | lg` (Dialog adds `xl` and `full`).
- **`Badge` sizing**: `Badge` defaults to `size="inline"`, a compact chip scaled to the text it
  annotates — right for table cells and running copy. Standing a badge in a row of controls, give
  it the same size as its neighbours (`size="md"` next to default buttons) so it shares their
  height instead of sitting at half of it. A sized badge still never reads as pressable: it keeps
  the pill silhouette (`--loidolt-border-radius-pill`, the system's only rounded corner), a
  recessed fill, and the wider label tracking, all of which hold without hover.
- **Headings** are configurable via `headingLevel` on `Alert`, `Card`, `Dialog`, `PageHeader`,
  `Panel`, and `Section`, so components slot into any page outline.
- **User-facing strings** are props, not literals: `optionalText`, `loadingLabel`, `closeLabel`,
  `dismissLabel`, `navLabel`, `label`, `decrementLabel` / `incrementLabel`.

### Toasts

`createToaster()` provides the queue, auto-dismiss timers, and pause-on-hover that `Toast` and
`ToastViewport` render:

```svelte
<script lang="ts">
  import { createToaster, Toast, ToastViewport } from '@loidolt/theme-svelte';

  const toaster = createToaster({ duration: 6000 });
</script>

<ToastViewport onpointerenter={toaster.pause} onpointerleave={toaster.resume}>
  {#each toaster.toasts as toast (toast.id)}
    <Toast {...toast} onDismiss={() => toaster.dismiss(toast.id)} />
  {/each}
</ToastViewport>
```

`toaster.success`, `info`, `warning` and `error` are shortcuts for `push` with a variant; `error`
stays until dismissed unless you pass a `duration`, so a failure is never missed. A toast can carry
one `action` — `{ label: 'Undo', onAction }` — and `toaster.update(id, patch)` changes a toast in
place, for "Uploading…" becoming "Uploaded". `ToastViewport` takes a `position`.

`ToastViewport` is the single live region — `Toast` deliberately carries no `role="status"`, so
nothing is announced twice.

Component-scoped toaster instances release their timers automatically. A module-scoped singleton
must call `toaster.destroy()` when its application lifetime ends.

### Tooltips

Wrap the application once in `TooltipProvider` so the skip-delay grouping works across every
tooltip. A `Tooltip` without a provider ancestor creates its own, which is correct but loses
grouping.

## Media

`VideoPlayer` and `AudioPlayer` put this system's controls on native media elements;
`MediaEmbed` shows YouTube and Vimeo behind a click-to-load facade, so nothing is requested from
the provider until the user presses play.

```svelte
<VideoPlayer
  label="Cutting a bracket"
  src="/media/cut.webm"
  tracks={[{ src: '/media/cut.en.vtt', srclang: 'en', label: 'English' }]}
/>
<MediaEmbed url="https://youtu.be/aqz-KE-bpKQ" title="Assembly guide" />
```

HLS playlists (`.m3u8`) play natively in Safari. Elsewhere they need hls.js, an optional peer
dependency the package never imports itself; register it once and only apps that stream pay for
it:

```ts
import { setHlsLoader } from '@loidolt/theme-svelte';

setHlsLoader(() => import('hls.js').then((module) => module.default));
```

The players are built on `createMediaPlayer()` — reactive state and commands over any `<video>`
or `<audio>` (`{@attach player.attach}`) — for when you want your own controls.
`createMediaZoom()` provides pinch, trackpad and drag-to-pan zoom for an image in a frame, and
`formatDuration`, `formatDurationSpoken`, `parseEmbedUrl`, `buildEmbedSrc` and `inferMediaKind`
are exported for your own media UI.

## Behaviour helpers

Every overlay, menu and group in the library already handles its own keyboard and focus. When
you build a custom surface, these attachments give it the same contract. They run only in the
browser, so they are SSR-safe, and they re-run when their arguments change:

```svelte
<script lang="ts">
  import { clickOutside, escapeKey, focusTrap, rovingFocus } from '@loidolt/theme-svelte';
  let open = $state(false);
  let trigger = $state<HTMLButtonElement | null>(null);
</script>

<div
  {@attach escapeKey(() => (open = false), { enabled: open })}
  {@attach clickOutside(() => (open = false), { enabled: open, ignore: [trigger] })}
  {@attach focusTrap({ enabled: open })}
>
  …
</div>

<div role="toolbar" aria-label="Formatting" {@attach rovingFocus()}>
  <button data-roving-item>Bold</button>
  <button data-roving-item>Italic</button>
</div>
```

| Helper                           | Contract                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `escapeKey(handler, options)`    | Escape anywhere (or only inside, with `scope: 'node'`); ignored during IME composition.                            |
| `clickOutside(handler, options)` | A press outside the element and outside `ignore`; one `pointerdown` listener covers mouse, pen and touch.          |
| `autofocus(options)`             | Focus on mount, on the next frame or after `delay`; `select` also selects an input's text.                         |
| `rovingFocus(options)`           | Arrow, Home and End keys between `[data-roving-item]` descendants, skipping disabled ones, with a single tab stop. |
| `focusTrap(options)`             | Tab and Shift+Tab stay inside while enabled; focus returns to where it was when released.                          |

`createAnnouncer()` drives a `LiveRegion`. It empties the region between messages, so a
repeated message is still announced, and clears it after `clearAfter` milliseconds:

```svelte
<script lang="ts">
  import { createAnnouncer, LiveRegion } from '@loidolt/theme-svelte';
  const announcer = createAnnouncer();
</script>

<LiveRegion message={announcer.message} politeness={announcer.politeness} />
<button onclick={() => announcer.announce('Draft saved')}>Save</button>
```

`describedBy(...ids)` joins the ids that describe a control into one `aria-describedby` value,
or `undefined` when none are present.

The tokens package exports the WCAG contrast arithmetic the token tests use —
`getContrastRatio`, `meetsContrast`, `validateContrast`, `getContrastTextColor` — for colours
chosen at runtime, and named `aspectRatio` frames (`square`, `video`, `photo`, `portrait`,
`wide`) that are also emitted as `--loidolt-aspect-*`.

The styles package adds `.ldt-sr-only-focusable`, `.ldt-touch-target-expand` (a 44px hit area
that does not change layout), `.ldt-line-clamp` (with `--ldt-lines`), and `.ldt-print-visible`.

## Utilities and types

```ts
import {
  autofocus,
  breakpointQuery,
  buildEmbedSrc,
  canPlayHlsNatively,
  clickOutside,
  createAnnouncer,
  createDataTable,
  createHlsSource,
  createMediaPlayer,
  createMediaQuery,
  createMediaZoom,
  createTheme,
  createToaster,
  cx,
  describedBy,
  embedThumbnail,
  escapeKey,
  focusTrap,
  formatDuration,
  formatDurationSpoken,
  inferMediaKind,
  isHlsSource,
  loadHls,
  mediaLabel,
  mediaThumbnail,
  parseEmbedUrl,
  resolveAspectRatio,
  rovingFocus,
  setHlsLoader,
  strokeLength,
  strokePath,
  strokesToSvg,
  themeScript,
  toMediaSources,
  validateSignature,
} from '@loidolt/theme-svelte';
import type {
  ActionVariant,
  Alignment,
  Announcer,
  AnnouncerOptions,
  AspectRatioName,
  AudioMediaItem,
  AutofocusOptions,
  BadgeSize,
  BadgeVariant,
  BreakpointName,
  ChoiceOption,
  ClickOutsideOptions,
  ColorScheme,
  ColumnAlign,
  ControlSize,
  Crumb,
  DataTableColumn,
  DataTableFilterValue,
  DataTableOptions,
  DataTableRow,
  DataTableSort,
  DataTableState,
  DialogSize,
  Disclosure,
  EmbedMediaItem,
  EmbedProvider,
  EmbedSrcOptions,
  EscapeKeyOptions,
  FocusTrapOptions,
  HeadingLevel,
  HlsConstructor,
  HlsErrorData,
  HlsInstance,
  HlsLoader,
  HlsSource,
  HlsSourceOptions,
  HlsStatus,
  ImageMediaItem,
  MediaItem,
  MediaKind,
  MediaPlayer,
  MediaPlayerLabels,
  MediaPlayerOptions,
  MediaQuery,
  MediaQueryOptions,
  MediaSourceEntry,
  MediaTextTrack,
  MediaTrackInfo,
  MediaZoom,
  MediaZoomOptions,
  MenuCheckboxItem,
  MenuEntry,
  MenuGroup,
  MenuItem,
  MenuRadioGroup,
  MenuSub,
  NavItem,
  Option,
  OptionGroup,
  Orientation,
  ParsedEmbed,
  Placement,
  Politeness,
  RovingFocusOptions,
  SignatureError,
  SignaturePoint,
  SignatureStroke,
  SignatureValue,
  SortDirection,
  StatusVariant,
  Theme,
  ThemeOptions,
  ThemePreference,
  ThemeScriptOptions,
  ToastAction,
  Toaster,
  ToasterOptions,
  ToastOptions,
  ToastRecord,
  ToastShortcutOptions,
  TriggerChildProps,
  VideoMediaItem,
} from '@loidolt/theme-svelte';
```

`cx(...values)` joins truthy class names and drops the rest, so `cx('ldt-x', active && 'is-on')`
is safe.

## Development

```sh
npm install
npm run dev                 # documentation site
npm run dev -- --port 4321  # arguments are forwarded to Vite
npm run check               # packages, types, tests, lint, formatting, and the docs build
```

The documentation site in `examples/catalog` is the reference consumer: a live example, the
accessibility notes, and a prop table for every component, plus the foundations and the
composition patterns. Its prop tables are **generated from the component sources** by
`examples/catalog/scripts/extract-props.mjs` on every `dev` and `build` — a prop table maintained
by hand is wrong within a release, so nothing about the props is written twice. The site's own
component list is checked against the package barrel, and an export with no registry entry is
reported on the components page rather than quietly missing.

### Deploying the documentation

The site is a fully prerendered static build served from Cloudflare Workers static assets — no
`main`, so nothing runs per request. `.github/workflows/deploy-docs.yml` deploys every push to
`main`, and needs two repository secrets: `CLOUDFLARE_API_TOKEN` (a token with _Edit Cloudflare
Workers_ on the account, plus DNS edit on the `loidolt.space` zone the first time the custom
domain is provisioned) and `CLOUDFLARE_ACCOUNT_ID`.

To deploy by hand with your own `wrangler login`:

```sh
npm run deploy:docs
```

`npm run check` builds the packages first, which is what lets the published-shape smoke test
run; a bare `npm test` on a fresh clone passes and skips that one file.

Publishing happens in CI only: the packages set `provenance: true`, which requires a CI OIDC
token, so a local `npm run release` will fail by design.

Add a Changeset for every public package change:

```sh
npm run changeset
```

See [Migrating existing apps](docs/MIGRATING_EXISTING_APPS.md) for the intended Topostack and
Label Studio adoption path.

## License

MIT. Bundled font licenses are included alongside the font files.
