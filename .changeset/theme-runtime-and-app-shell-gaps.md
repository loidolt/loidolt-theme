---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Close the gaps an application hits in its first week: a theme runtime, a responsive story, a
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
