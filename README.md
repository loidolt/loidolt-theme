# Loidolt Theme

A shared, Svelte-first design system for Loidolt applications. It packages the warm workshop
language established in Topostack and Label Studio: paper and panel surfaces, precise borders,
orange actions, Jost display type, and Archivo utility text.

The library is intentionally light-first, Tailwind-free, and free of authentication or
application-domain code.

## Packages

| Package                 | Purpose                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `@loidolt/theme-tokens` | Typed colour, typography, spacing, sizing, border, shadow, z-index, and motion values plus generated CSS variables |
| `@loidolt/theme-styles` | Bundled fonts, base styles, accessibility helpers, component classes, and layout utilities                         |
| `@loidolt/theme-svelte` | Accessible Svelte 5 controls, overlays, feedback, surfaces, and application layouts                                |

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

| Prefix        | Meaning                                                                                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--loidolt-*` | The public token contract. Primitives (`--loidolt-color-*`) and semantic roles (`--loidolt-surface`). Override these to theme the system.                                                              |
| `--ldt-*`     | Per-component knobs read at a single call site — `--ldt-dialog-width`, `--ldt-sidebar-width`, `--ldt-inspector-width`, `--ldt-gap`, `--ldt-min`. Set them inline or on a wrapper to tune one instance. |

### Tokens have two tiers

Primitives hold the raw palette and scales. The **semantic** tier names the role a value plays,
and it is the only tier the stylesheets read:

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

To write your own instead, redefine the same roles:

```css
[data-theme='midnight'] {
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

The catalog ships a live example of both (a dark-mode switch and a side-by-side override panel).

### Cascade layers

Styles are published in `@layer loidolt.tokens, loidolt.reset, loidolt.base, loidolt.components,
loidolt.utilities, loidolt.a11y`. Unlayered application CSS outranks all of them, so plain
selectors in your app always win — no `!important` needed. `loidolt.reset` is deliberately empty
and reserved for an app's own reset.

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

## Components

- Actions: `Button` (`variant="text"` covers the former `TextButton`), `IconButton`, `ToggleGroup`
- Forms: `Field`, `Fieldset`, `Label`, `Input`, `Textarea`, `NumberField`, `Select`, `Checkbox`, `RadioGroup`, `Switch`
- Surfaces: `Card`, `Panel`, `Badge`, `Separator`, `PageHeader`, `Section`
- Data: `Table`, `TableHeader`, `EmptyState`, `Pagination`
- Overlays: `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `DropdownMenu`, `Tooltip`, `TooltipProvider`
- Navigation: `Topbar`, `Brand`, `NavMenu`, `Breadcrumbs`, `Tabs`, `Accordion`, `ContextBar`
- Feedback: `Alert`, `Toast`, `ToastViewport`, `Spinner`, `Skeleton`, `Progress`
- Layout: `AppShell`, `Workspace`, `Sidebar`
- Theme: `ThemeToggle`

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
  `info | success | warning | error`; sizes are `sm | md | lg` (Dialog adds `xl`).
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

`ToastViewport` is the single live region — `Toast` deliberately carries no `role="status"`, so
nothing is announced twice.

### Tooltips

Wrap the application once in `TooltipProvider` so the skip-delay grouping works across every
tooltip. A `Tooltip` without a provider ancestor creates its own, which is correct but loses
grouping.

## Utilities and types

```ts
import {
  breakpointQuery,
  createMediaQuery,
  createTheme,
  createToaster,
  cx,
  themeScript,
} from '@loidolt/theme-svelte';
import type {
  ActionVariant,
  Alignment,
  BadgeSize,
  BadgeVariant,
  BreakpointName,
  ColorScheme,
  ColumnAlign,
  ControlSize,
  Crumb,
  DialogSize,
  Disclosure,
  HeadingLevel,
  MediaQuery,
  MediaQueryOptions,
  MenuItem,
  NavItem,
  Option,
  Orientation,
  Placement,
  SortDirection,
  StatusVariant,
  Theme,
  ThemeOptions,
  ThemePreference,
  ThemeScriptOptions,
  Toaster,
  ToasterOptions,
  ToastOptions,
  ToastRecord,
  TriggerChildProps,
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
