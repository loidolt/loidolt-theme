export { isTauri, markTauriPlatform, tauriPlatform } from './platform.js';
export type { TauriPlatform } from './platform.js';
export { deepLinkPath, handleDeepLinks } from './deep-links.js';
export type { DeepLinkOptions } from './deep-links.js';
export { filesFromArgs, handleSecondInstance } from './single-instance.js';
export type { SecondInstance, SingleInstanceOptions } from './single-instance.js';
export { createTray } from './tray.js';
export type { Tray, TrayContent, TrayMenuItem, TrayOptions } from './tray.js';
export { setupTauri } from './setup.js';
export type { SetupTauriOptions, TauriPlugins, TauriSetup } from './setup.js';
export type {
  DeepLinkPlugin,
  EventModule,
  MenuModule,
  OsPlugin,
  TauriResource,
  Teardown,
  TrayIconHandle,
  TrayImage,
  TrayMenuEntry,
  TrayModule,
  UnlistenFn,
} from './types.js';
