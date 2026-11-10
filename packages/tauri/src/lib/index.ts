export { isTauri, markTauriPlatform, tauriPlatform } from './platform.js';
export type { TauriPlatform } from './platform.js';
export { setupTauri } from './setup.js';
export type { SetupTauriOptions, TauriPlugins, TauriSetup } from './setup.js';
export {
  insetWindowChrome,
  showWindow,
  syncWindowAppearance,
  windowBackground,
} from './window.svelte.js';
export type {
  ShowWindowOptions,
  WindowAppearance,
  WindowAppearanceOptions,
  WindowChromeOptions,
} from './window.svelte.js';
export type { OsPlugin, Teardown, UnlistenFn, WindowPlugin, WindowTheme } from './types.js';
