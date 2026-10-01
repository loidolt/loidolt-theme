/**
 * Design tokens for Loidolt applications.
 *
 * Three tiers:
 * - **Primitives** (`--loidolt-color-*`, `--loidolt-space-*`, …) are the raw palette and scales.
 * - **Colour roles** (`--loidolt-surface`, `--loidolt-text`, …) name what a colour is *for*.
 * - **Shape and voice roles** (`--loidolt-radius-control`, `--loidolt-pad-cell`, …) do the same
 *   for corners, strokes, density and typographic voice.
 *
 * Stylesheets and components consume only the role tiers, so a consumer can restyle the
 * system — or add a dark mode, or a whole preset — by redefining roles alone.
 */
import { tokens } from './tokens.js';

export {
  borders,
  breakpoints,
  colors,
  cssVarName,
  darkSemantic,
  flattenTokens,
  generateCss,
  generateDarkCss,
  motion,
  roles,
  semantic,
  shadows,
  sizing,
  spacing,
  tokens,
  typography,
  zIndex,
} from './tokens.js';
export type { ThemeTokens, TokenRef } from './tokens.js';

export default tokens;
