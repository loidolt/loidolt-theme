---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
---

Rebuild the token layer around a real semantic tier, and fix the generator that silently broke
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
