---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': patch
---

Fix a set of layout, contrast and target-size defects found by measuring the rendered catalog at
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
