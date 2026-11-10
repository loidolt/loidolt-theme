import { onDestroy } from 'svelte';
import { combine, markTauriPlatform, tauriPlatform, type TauriPlatform } from './platform.js';
import type { OsPlugin, Teardown } from './types.js';

/**
 * The Tauri modules you installed, passed as namespaces (`import * as os from
 * '@tauri-apps/plugin-os'`). Each one present turns on the adapters that use it.
 */
export interface TauriPlugins {
  /** `@tauri-apps/plugin-os`: the platform from Rust instead of the user agent. */
  os?: OsPlugin;
}

export interface SetupTauriOptions {
  plugins?: TauriPlugins;
  /** `data-tauri-platform` on `<html>`. On by default; `false` leaves the root alone. */
  markPlatform?: boolean;
}

export interface TauriSetup {
  /** The OS around the window, or `null` in a browser and on the server. */
  readonly platform: TauriPlatform | null;
  /** Settles once every adapter that needs a round trip to Rust has applied. */
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
  const { os } = options.plugins ?? {};
  const platform = tauriPlatform(os);
  const teardowns: Teardown[] = [];

  if (options.markPlatform !== false) teardowns.push(markTauriPlatform(undefined, os));

  const ready = Promise.resolve();

  const destroy = combine(...teardowns);
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return { platform, ready, destroy };
}
