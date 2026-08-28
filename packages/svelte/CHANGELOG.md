# @loidolt/theme-svelte

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
