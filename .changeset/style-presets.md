---
'@loidolt/theme-tokens': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add style presets: named style sets that restyle colours for both schemes plus the corners,
strokes, density and typographic voice of every component.

- **Tokens.** A new shape-and-voice role tier (`--loidolt-radius-*`, `--loidolt-stroke-*`,
  `--loidolt-pad-*`, `--loidolt-gap-*`, `--loidolt-label-*`, `--loidolt-control-*`,
  `--loidolt-heading-weight`, `--loidolt-strong-weight`), exported as `roles`. New
  `definePreset()`, `generatePresetCss()`, `presetStylesheets()` and `auditContrast()`, and
  three built-in presets — `loidolt`, `soft` and `compact` — shipped as
  `@loidolt/theme-tokens/css/presets/*`.
- **Styles.** Every component now reads padding, gaps, radius, strokes, tracking, weight and
  text case from those roles; the default look is unchanged, pixel for pixel. Preset
  stylesheets are re-exported as `@loidolt/theme-styles/presets/*`.
- **Svelte.** `createTheme()` and `themeScript()` take `presets` (plus `defaultPreset`,
  `presetStorageKey`, `presetAttribute`) and manage `data-preset` alongside `data-theme`. New
  `PresetPicker` component. `ToggleGroup` now keeps its pressed item in sync with a parent that
  rejects a change.

Two behaviour changes to note:

- Overriding `--loidolt-border-radius` now rounds surfaces and overlays as well as buttons,
  because every radius role defaults to it.
- `.ldt-theme` now also sets `font-family: var(--loidolt-font-display)`.
