---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add `Combobox`, `MultiSelect`, `Slider`, `PasswordInput`, `OTPInput` and `Avatar`.

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
