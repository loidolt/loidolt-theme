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

WCAG contrast arithmetic, for colours chosen at runtime:

```ts
import { getContrastRatio, getContrastTextColor, meetsContrast } from '@loidolt/theme-tokens';

meetsContrast('#767676', '#ffffff'); // true — AA for body text
getContrastTextColor(userColour); // the theme ink that reads best on it
```

Named media frames live in `aspectRatio` (`square`, `video`, `photo`, `portrait`, `wide`) and as
`--loidolt-aspect-*`.

Define your own style presets with `definePreset()`, write their stylesheets with
`presetStylesheets()`, and check them with `auditContrast()`. See the
[Presets](https://github.com/loidolt/loidolt-theme#presets) section of the main README.
