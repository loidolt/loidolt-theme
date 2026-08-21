# @loidolt/theme-styles

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
