export { isNativePlatform, markNativePlatform, nativePlatform } from './platform.js';
export type { NativePlatform } from './platform.js';
export { setupCapacitor } from './setup.js';
export type { CapacitorPlugins, CapacitorSetup, SetupCapacitorOptions } from './setup.js';
export { syncNativeAppearance, systemBarStyleFor } from './appearance.js';
export type { NativeAppearanceOptions, SystemBarStyle } from './appearance.js';
export { closeTopLayer, handleBackButton } from './back-button.js';
export type { BackButtonEvent, BackButtonOptions } from './back-button.js';
export { createNativeKeyboard } from './keyboard.svelte.js';
export type { NativeKeyboard, NativeKeyboardOptions } from './keyboard.svelte.js';
export { createHaptics, SELECTION_TARGETS, withHaptics } from './haptics.js';
export type {
  HapticsOptions,
  ImpactWeight,
  InstallHapticsOptions,
  NativeHaptics,
} from './haptics.js';
export { persistTheme } from './theme-storage.svelte.js';
export type { PersistedTheme, PersistThemeOptions } from './theme-storage.svelte.js';
export { createAppLifecycle, pauseAllMedia } from './lifecycle.svelte.js';
export type { AppLifecycle, AppLifecycleOptions } from './lifecycle.svelte.js';
export { deepLinkPath, handleDeepLinks } from './deep-links.js';
export type { DeepLinkOptions } from './deep-links.js';
export { createNetworkStatus } from './network.svelte.js';
export type { NetworkStatus, NetworkStatusOptions } from './network.svelte.js';
export { openExternalLinks } from './links.js';
export type { ExternalLinksOptions } from './links.js';
export { createShare, SHARE_CACHE_PATH } from './share.js';
export type {
  NativeShare,
  ShareableFile,
  ShareContent,
  ShareMethod,
  NativeShareOptions,
  ShareOutcome,
} from './share.js';
export { bridgeClipboard, followSystemTextSize, hideSplashScreen } from './system.js';
export type { HideSplashOptions, SystemTextSizeOptions } from './system.js';
export type {
  AppResumePlugin,
  AppStatePlugin,
  AppUrlPlugin,
  BackButtonPlugin,
  BrowserPlugin,
  ClipboardPlugin,
  FilesystemPlugin,
  HapticsPlugin,
  KeyboardPlugin,
  KeyboardStylePlugin,
  NetworkPlugin,
  PluginListenerHandle,
  PreferencesPlugin,
  SharePlugin,
  SplashScreenPlugin,
  StatusBarPlugin,
  SystemBarsPlugin,
  Teardown,
  TextZoomPlugin,
} from './types.js';
