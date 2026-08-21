# @loidolt/theme-svelte

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
