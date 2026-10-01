# @loidolt/theme-tokens

Typed design tokens and generated CSS custom properties for the Loidolt design system.

```sh
npm install @loidolt/theme-tokens
```

```ts
import { colors, semantic, spacing, tokens } from '@loidolt/theme-tokens';
```

```css
@import '@loidolt/theme-tokens/css';
@import '@loidolt/theme-tokens/css/dark';
@import '@loidolt/theme-tokens/css/presets/soft'; /* built-in presets: loidolt, soft, compact */
```

Define your own style presets with `definePreset()`, write their stylesheets with
`presetStylesheets()`, and check them with `auditContrast()`. See the
[Presets](https://github.com/loidolt/loidolt-theme#presets) section of the main README.
