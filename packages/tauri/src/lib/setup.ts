import { onDestroy } from 'svelte';
import { handleDeepLinks, type DeepLinkOptions } from './deep-links.js';
import { combine, markTauriPlatform, tauriPlatform, type TauriPlatform } from './platform.js';
import { handleSecondInstance, type SingleInstanceOptions } from './single-instance.js';
import { createTray, type Tray, type TrayOptions } from './tray.js';
import type {
  DeepLinkPlugin,
  EventModule,
  MenuModule,
  OsPlugin,
  Teardown,
  TrayModule,
} from './types.js';

/**
 * The Tauri modules you installed, passed as namespaces (`import * as os from
 * '@tauri-apps/plugin-os'`). Each one present turns on the adapters that use it.
 */
export interface TauriPlugins {
  /** `@tauri-apps/plugin-os`: the platform from Rust instead of the user agent. */
  os?: OsPlugin;
  /** `@tauri-apps/api/event`: second launches, with `singleInstance`. */
  event?: EventModule;
  /** `@tauri-apps/plugin-deep-link`: URLs that open the app, with `deepLinks`. */
  deepLink?: DeepLinkPlugin;
  /** `@tauri-apps/api/tray` and `@tauri-apps/api/menu`: a tray icon, with `tray`. */
  tray?: TrayModule;
  menu?: MenuModule;
}

export interface SetupTauriOptions {
  plugins?: TauriPlugins;
  /** `data-tauri-platform` on `<html>`. On by default; `false` leaves the root alone. */
  markPlatform?: boolean;
  /** Second launches of the app, forwarded by `tauri-plugin-single-instance`. Needs `event`. */
  singleInstance?: Omit<SingleInstanceOptions, 'event'>;
  /** Links that open the app, routed with `navigate` or `onUrl`. Needs `deepLink`. */
  deepLinks?: Omit<DeepLinkOptions, 'deepLink'>;
  /** A tray icon with a menu, as `desktop.tray`. Needs `tray` and `menu`. */
  tray?: Omit<TrayOptions, 'tray' | 'menu'>;
}

export interface TauriSetup {
  /** The OS around the window, or `null` in a browser and on the server. */
  readonly platform: TauriPlatform | null;
  /** Settles once every adapter that needs a round trip to Rust has applied. */
  readonly ready: Promise<void>;
  /** Present when `tray` options and the `tray` and `menu` modules were given. */
  readonly tray: Tray | undefined;
  /** Removes everything. Automatic when called during component initialisation. */
  destroy(): void;
}

/**
 * Every adapter in one call, each turned on by the module it needs. Call it once, in the root
 * layout, with what the app installed:
 *
 * ```svelte
 * <script lang="ts">
 *   import * as os from '@tauri-apps/plugin-os';
 *   import { setupTauri } from '@loidolt/theme-tauri';
 *
 *   const desktop = setupTauri({ plugins: { os } });
 * </script>
 * ```
 *
 * In a browser (or on the server) every adapter is a no-op, so the same layout ships to the web.
 */
export function setupTauri(options: SetupTauriOptions = {}): TauriSetup {
  const { os, event, deepLink, tray: trayModule, menu } = options.plugins ?? {};
  const platform = tauriPlatform(os);
  const teardowns: Teardown[] = [];

  if (options.markPlatform !== false) teardowns.push(markTauriPlatform(undefined, os));

  if (event && options.singleInstance) {
    teardowns.push(handleSecondInstance({ ...options.singleInstance, event }));
  }
  if (deepLink && options.deepLinks) {
    teardowns.push(handleDeepLinks({ ...options.deepLinks, deepLink }));
  }
  let tray: Tray | undefined;
  if (trayModule && menu && options.tray) {
    tray = createTray({ ...options.tray, tray: trayModule, menu });
    teardowns.push(tray.destroy);
  }

  const ready = Promise.all([tray?.ready]).then(() => {});

  const destroy = combine(...teardowns);
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return { platform, ready, tray, destroy };
}
