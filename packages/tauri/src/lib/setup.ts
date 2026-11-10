import type { Theme } from '@loidolt/theme-svelte';
import { onDestroy } from 'svelte';
import {
  combine,
  isTauri,
  markTauriPlatform,
  tauriPlatform,
  type TauriPlatform,
} from './platform.js';
import type { OsPlugin, Teardown, WindowPlugin } from './types.js';
import {
  insetWindowChrome,
  showWindow,
  syncWindowAppearance,
  type ShowWindowOptions,
  type WindowAppearanceOptions,
  type WindowChromeOptions,
} from './window.svelte.js';

/**
 * The Tauri modules you installed, passed as namespaces (`import * as os from
 * '@tauri-apps/plugin-os'`). Each one present turns on the adapters that use it.
 */
export interface TauriPlugins {
  /** `@tauri-apps/plugin-os`: the platform from Rust instead of the user agent. */
  os?: OsPlugin;
  /**
   * The window: `getCurrentWindow` from `@tauri-apps/api/window`, or the window it returns. Pass
   * the function itself to keep the layout browser-safe: it reads the Tauri runtime, so calling
   * it in a browser throws, and `setupTauri` only calls it inside a window. Turns on the window
   * background and appearance, the overlay title bar insets, and showing a window that starts
   * hidden.
   */
  window?: WindowPlugin | (() => WindowPlugin);
}

/** `false` turns one adapter off even though its module is present. */
type Toggle<T> = T | false;

const on = <T extends object>(value: Toggle<T> | undefined): T | null =>
  value === false ? null : (value ?? ({} as T));

export interface SetupTauriOptions {
  plugins?: TauriPlugins;
  /** `data-tauri-platform` on `<html>`. On by default; `false` leaves the root alone. */
  markPlatform?: boolean;
  /**
   * The app's `createTheme` store: the window's native light or dark appearance follows it, and
   * `system` hands the appearance back to the OS. Needs `window`.
   */
  theme?: Theme;
  /** The window background (and, with `theme`, appearance) following the page. Needs `window`. */
  appearance?: Toggle<Omit<WindowAppearanceOptions, 'window' | 'theme'>>;
  /**
   * The title bar `tauri.conf.json` sets up. `{ titleBar: 'overlay' }` insets the page to clear
   * the macOS window buttons. Needs `window`.
   */
  chrome?: Toggle<Omit<WindowChromeOptions, 'window'>>;
  /**
   * Shows the window once the theme has reached it and the fonts are in — pair it with
   * `"visible": false` in `tauri.conf.json` for a launch with no flash. On by default; needs
   * `window`.
   */
  show?: Toggle<Omit<ShowWindowOptions, 'window' | 'until'>>;
}

export interface TauriSetup {
  /** The OS around the window, or `null` in a browser and on the server. */
  readonly platform: TauriPlatform | null;
  /**
   * Settles once every adapter that needs a round trip to Rust has applied — with `window`, once
   * the window has its background and appearance and has been shown. Never rejects.
   */
  readonly ready: Promise<void>;
  /** Removes everything. Automatic when called during component initialisation. */
  destroy(): void;
}

/**
 * Every adapter in one call, each turned on by the module it needs. Call it once, in the root
 * layout, with what the app installed:
 *
 * ```svelte
 * <script lang="ts">
 *   import { getCurrentWindow } from '@tauri-apps/api/window';
 *   import * as os from '@tauri-apps/plugin-os';
 *   import { setupTauri } from '@loidolt/theme-tauri';
 *   import { theme } from '$lib/theme';
 *
 *   const desktop = setupTauri({
 *     plugins: { os, window: getCurrentWindow },
 *     theme,
 *     chrome: { titleBar: 'overlay' },
 *   });
 * </script>
 * ```
 *
 * In a browser (or on the server) every adapter is a no-op, so the same layout ships to the web.
 */
export function setupTauri(options: SetupTauriOptions = {}): TauriSetup {
  const { os, window: windowOption } = options.plugins ?? {};
  const platform = tauriPlatform(os);
  const win =
    typeof windowOption === 'function' ? (isTauri() ? windowOption() : undefined) : windowOption;
  const teardowns: Teardown[] = [];

  if (options.markPlatform !== false) teardowns.push(markTauriPlatform(undefined, os));

  let ready = Promise.resolve();
  if (win) {
    const appearanceOptions = on(options.appearance);
    const appearance = appearanceOptions
      ? syncWindowAppearance({ ...appearanceOptions, window: win, theme: options.theme }, os)
      : undefined;
    if (appearance) teardowns.push(appearance.destroy);
    const chrome = on(options.chrome);
    if (chrome) teardowns.push(insetWindowChrome({ ...chrome, window: win }, os));
    const applied = appearance?.ready ?? Promise.resolve();
    const show = on(options.show);
    ready = show ? showWindow({ ...show, window: win, until: applied }, os) : applied;
  }

  const destroy = combine(...teardowns);
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return { platform, ready, destroy };
}
