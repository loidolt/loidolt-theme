---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Extend existing components with capabilities ported from classic-theme.

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
