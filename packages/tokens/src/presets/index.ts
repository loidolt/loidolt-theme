import { compact } from './compact.js';
import { loidolt } from './loidolt.js';
import { soft } from './soft.js';

export { compact, loidolt, soft };

/** The presets this package ships, default first. */
export const builtInPresets = [loidolt, soft, compact] as const;

/** Names of the built-in presets, for `createTheme({ presets })` and pickers. */
export type BuiltInPresetName = (typeof builtInPresets)[number]['name'];
