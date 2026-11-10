import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle, Teardown } from './types.js';

export type NativePlatform = 'ios' | 'android';

export const noop: Teardown = () => {};

/**
 * The native shell the page runs in, or `null` in a browser and on the server. Every adapter
 * checks this first, so the same app code ships to the web untouched.
 */
export function nativePlatform(): NativePlatform | null {
  if (typeof document === 'undefined') return null;
  try {
    if (!Capacitor.isNativePlatform()) return null;
    const platform = Capacitor.getPlatform();
    return platform === 'ios' || platform === 'android' ? platform : null;
  } catch {
    return null;
  }
}

/** Whether the page runs inside a Capacitor iOS or Android shell. */
export const isNativePlatform = (): boolean => nativePlatform() !== null;

/**
 * Writes `data-native-platform="ios"` (or `"android"`) on `<html>`, which `styles.css` keys its
 * native touch manners to and which your own CSS can use for a platform-specific tweak. Returns
 * the teardown. A no-op in a browser.
 */
export function markNativePlatform(element?: HTMLElement): Teardown {
  const platform = nativePlatform();
  const root = element ?? (typeof document === 'undefined' ? null : document.documentElement);
  if (!platform || !root) return noop;
  root.dataset.nativePlatform = platform;
  return () => {
    delete root.dataset.nativePlatform;
  };
}

/**
 * Plugin calls are cosmetic here — a status bar tint, a buzz. A rejection (a plugin missing from
 * the native project, a method one platform lacks) must never surface as an unhandled error.
 */
export function quietly(result: unknown): void {
  if (result && typeof (result as Promise<unknown>).catch === 'function') {
    (result as Promise<unknown>).catch(() => {});
  }
}

/**
 * Turns `addListener`'s promised handle into a synchronous teardown. A teardown that runs before
 * the handle arrives still removes the listener once it does.
 */
export function listen(pending: Promise<PluginListenerHandle> | PluginListenerHandle): Teardown {
  let removed = false;
  let handle: PluginListenerHandle | undefined;
  Promise.resolve(pending).then(
    (resolved) => {
      if (removed) quietly(resolved.remove());
      else handle = resolved;
    },
    () => {}
  );
  return () => {
    if (removed) return;
    removed = true;
    if (handle) quietly(handle.remove());
  };
}

/** One teardown for several. */
export function combine(...teardowns: Array<Teardown | undefined>): Teardown {
  let done = false;
  return () => {
    if (done) return;
    done = true;
    for (const teardown of teardowns) teardown?.();
  };
}
