---
'@loidolt/theme-svelte': minor
---

Settle the component API before v1: typed props, one callback convention, and Bits UI wrappers
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
