import type { Theme, Toaster } from '@loidolt/theme-svelte';
import { onDestroy } from 'svelte';
import { syncNativeAppearance, type NativeAppearanceOptions } from './appearance.js';
import { handleBackButton, type BackButtonOptions } from './back-button.js';
import {
  createHaptics,
  type HapticsOptions,
  type InstallHapticsOptions,
  type NativeHaptics,
  withHaptics,
} from './haptics.js';
import {
  createNativeKeyboard,
  type NativeKeyboard,
  type NativeKeyboardOptions,
} from './keyboard.svelte.js';
import { handleDeepLinks, type DeepLinkOptions } from './deep-links.js';
import {
  createAppLifecycle,
  type AppLifecycle,
  type AppLifecycleOptions,
} from './lifecycle.svelte.js';
import { openExternalLinks, type ExternalLinksOptions } from './links.js';
import {
  createNetworkStatus,
  type NetworkStatus,
  type NetworkStatusOptions,
} from './network.svelte.js';
import { combine, markNativePlatform } from './platform.js';
import { bridgeClipboard, followSystemTextSize, hideSplashScreen } from './system.js';
import type { HideSplashOptions } from './system.js';
import { createShare, type NativeShare, type NativeShareOptions } from './share.js';
import { persistTheme } from './theme-storage.svelte.js';
import type {
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
  PreferencesPlugin,
  SharePlugin,
  SplashScreenPlugin,
  StatusBarPlugin,
  Teardown,
  TextZoomPlugin,
} from './types.js';

/** The plugins you installed. Each one present turns on the adapters that use it. */
export interface CapacitorPlugins {
  App?: BackButtonPlugin & AppStatePlugin & AppUrlPlugin & AppResumePlugin;
  Browser?: BrowserPlugin;
  Clipboard?: ClipboardPlugin;
  Filesystem?: FilesystemPlugin;
  Haptics?: HapticsPlugin;
  Keyboard?: KeyboardPlugin & KeyboardStylePlugin;
  Network?: NetworkPlugin;
  Preferences?: PreferencesPlugin;
  Share?: SharePlugin;
  SplashScreen?: SplashScreenPlugin;
  StatusBar?: StatusBarPlugin;
  TextZoom?: TextZoomPlugin;
}

/** `false` turns one adapter off even though its plugin is present. */
type Toggle<T> = T | false;

export interface SetupCapacitorOptions {
  plugins: CapacitorPlugins;
  /** The app's `createTheme` store, persisted natively with `Preferences`. */
  theme?: Theme;
  /** The app's toaster: status toasts get haptics, and connectivity changes are announced. */
  toaster?: Toaster;
  /** The router's navigation, for deep links — `goto` in SvelteKit. Needs `App`. */
  navigate?: DeepLinkOptions['navigate'];
  appearance?: Toggle<Omit<NativeAppearanceOptions, 'StatusBar' | 'Keyboard'>>;
  backButton?: Toggle<Omit<BackButtonOptions, 'App'>>;
  keyboard?: Toggle<Omit<NativeKeyboardOptions, 'Keyboard'>>;
  haptics?: Toggle<Omit<HapticsOptions, 'Haptics'> & InstallHapticsOptions>;
  lifecycle?: Toggle<Omit<AppLifecycleOptions, 'App'>>;
  links?: Toggle<Omit<ExternalLinksOptions, 'Browser'>>;
  network?: Toggle<Omit<NetworkStatusOptions, 'Network' | 'toaster'>>;
  splash?: Toggle<Omit<HideSplashOptions, 'SplashScreen' | 'until'>>;
  share?: Toggle<Omit<NativeShareOptions, 'Share' | 'Filesystem' | 'toaster'>>;
  textSize?: boolean;
  clipboard?: boolean;
}

export interface CapacitorSetup {
  /** Present when `Haptics` was given. */
  readonly haptics: NativeHaptics | undefined;
  /** Present when `Keyboard` was given. */
  readonly keyboard: NativeKeyboard | undefined;
  /** Present when `App` was given. */
  readonly lifecycle: AppLifecycle | undefined;
  /** Present when `Network` was given. */
  readonly network: NetworkStatus | undefined;
  /**
   * Sharing through `Share` (and `Filesystem`, for files) in a native shell, the Web Share API or
   * a download in a browser. Present unless `share: false`: the browser fallbacks need no plugin.
   */
  readonly share: NativeShare | undefined;
  /** The toaster you passed, with haptics on its status toasts when `Haptics` was given. */
  readonly toaster: Toaster | undefined;
  /** Settles once the stored theme is restored and the splash screen has lifted. */
  readonly ready: Promise<void>;
  /** Removes everything. Automatic when called during component initialisation. */
  destroy(): void;
}

const on = <T extends object>(value: Toggle<T> | undefined): T | null =>
  value === false ? null : (value ?? ({} as T));

/**
 * Every adapter in one call, each turned on by the plugin it needs. Call it once, in the root
 * layout, with the plugins the app installed:
 *
 * ```svelte
 * <script lang="ts">
 *   import { App } from '@capacitor/app';
 *   import { Haptics } from '@capacitor/haptics';
 *   import { Keyboard } from '@capacitor/keyboard';
 *   import { Preferences } from '@capacitor/preferences';
 *   import { SplashScreen } from '@capacitor/splash-screen';
 *   import { setupCapacitor } from '@loidolt/theme-capacitor';
 *   import { theme, toaster } from '$lib/app';
 *
 *   const native = setupCapacitor({
 *     plugins: { App, Haptics, Keyboard, Preferences, SplashScreen },
 *     theme,
 *     toaster,
 *     navigate: goto, // SvelteKit's, from its navigation module
 *   });
 * </script>
 * ```
 *
 * In a browser (or on the server) every adapter is a no-op, so the same layout ships to the web.
 */
export function setupCapacitor(options: SetupCapacitorOptions): CapacitorSetup {
  const { plugins, theme, navigate } = options;
  const { App, Browser, Clipboard, Haptics, Keyboard, Network, Preferences } = plugins;
  const { Filesystem, Share, SplashScreen, StatusBar, TextZoom } = plugins;
  const teardowns: Teardown[] = [markNativePlatform()];

  const appearance = on(options.appearance);
  if (appearance) teardowns.push(syncNativeAppearance({ ...appearance, StatusBar, Keyboard }));

  const persisted = theme && Preferences ? persistTheme(theme, { Preferences }) : undefined;
  if (persisted) teardowns.push(persisted.destroy);

  let haptics: NativeHaptics | undefined;
  const hapticsOptions = on(options.haptics);
  if (Haptics && hapticsOptions) {
    const { selection, ...rest } = hapticsOptions;
    haptics = createHaptics({ ...rest, Haptics });
    teardowns.push(haptics.install({ selection }));
  }
  const toaster =
    options.toaster && haptics ? withHaptics(options.toaster, haptics) : options.toaster;

  let keyboard: NativeKeyboard | undefined;
  const keyboardOptions = on(options.keyboard);
  if (Keyboard && keyboardOptions) {
    keyboard = createNativeKeyboard({ ...keyboardOptions, Keyboard });
    teardowns.push(keyboard.destroy);
  }

  let lifecycle: AppLifecycle | undefined;
  if (App) {
    const back = on(options.backButton);
    if (back) teardowns.push(handleBackButton({ ...back, App }));
    const lifecycleOptions = on(options.lifecycle);
    if (lifecycleOptions) {
      lifecycle = createAppLifecycle({ ...lifecycleOptions, App });
      teardowns.push(lifecycle.destroy);
    }
    if (navigate) teardowns.push(handleDeepLinks({ App, navigate }));
  }

  let network: NetworkStatus | undefined;
  const networkOptions = on(options.network);
  if (Network && networkOptions) {
    network = createNetworkStatus({ ...networkOptions, Network, toaster });
    teardowns.push(network.destroy);
  }

  const linkOptions = on(options.links);
  if (Browser && linkOptions) teardowns.push(openExternalLinks({ ...linkOptions, Browser }));

  if (TextZoom && options.textSize !== false) {
    teardowns.push(followSystemTextSize({ TextZoom, App }));
  }
  if (Clipboard && options.clipboard !== false) teardowns.push(bridgeClipboard({ Clipboard }));

  const shareOptions = on(options.share);
  const share = shareOptions
    ? createShare({ ...shareOptions, Share, Filesystem, toaster })
    : undefined;

  const restored = persisted?.ready ?? Promise.resolve();
  const splash = on(options.splash);
  const ready =
    SplashScreen && splash
      ? hideSplashScreen({ ...splash, SplashScreen, until: restored })
      : restored;

  const destroy = combine(...teardowns);
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return { haptics, keyboard, lifecycle, network, share, toaster, ready, destroy };
}
