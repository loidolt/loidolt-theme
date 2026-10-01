/**
 * Design tokens for Loidolt applications.
 *
 * Three tiers:
 * - **Primitives** (`--loidolt-color-*`, `--loidolt-space-*`, …) are the raw palette and scales.
 * - **Colour roles** (`--loidolt-surface`, `--loidolt-text`, `--loidolt-chart-1`, …) name what a
 *   colour is *for*.
 * - **Shape and voice roles** (`--loidolt-radius-control`, `--loidolt-pad-cell`, …) do the same
 *   for corners, strokes, density and typographic voice.
 *
 * Stylesheets and components consume only the role tiers, so a consumer can restyle the
 * system — or add a dark mode, or a whole preset — by redefining roles alone.
 */
import { tokens } from './tokens.js';

export {
  aspectRatio,
  borders,
  breakpoints,
  chartColors,
  chartRoles,
  colors,
  cssVarName,
  darkSemantic,
  flattenTokens,
  generateCss,
  generateDarkCss,
  mapColors,
  mapRoles,
  motion,
  resolveRoles,
  roleValue,
  roleVar,
  roles,
  semantic,
  shadows,
  sizing,
  spacing,
  syntaxColors,
  syntaxRoles,
  tokens,
  typography,
  zIndex,
} from './tokens.js';
export type {
  ChartColors,
  ColorScheme,
  MapColors,
  ResolvedRoles,
  RoleSpec,
  SemanticRole,
  SyntaxColors,
  ThemeTokens,
  TokenRef,
} from './tokens.js';

export * from './contrast.js';

export { definePreset, generatePresetCss, presetStylesheets } from './presets/define.js';
export type {
  ColorOverrides,
  ColorRole,
  Preset,
  PresetCssOptions,
  PresetDefinition,
  PresetPrimitives,
  Role,
} from './presets/define.js';
export { builtInPresets, compact, loidolt, soft } from './presets/index.js';
export type { BuiltInPresetName } from './presets/index.js';

export default tokens;
