import type { OsPlugin, Teardown, UnlistenFn } from './types.js';

/** The operating system around a Tauri window. */
export type TauriPlatform = 'macos' | 'windows' | 'linux' | 'ios' | 'android';

export const noop: Teardown = () => {};

/** The globals Tauri 2 injects into every window before the page's scripts run. */
interface TauriGlobals {
  isTauri?: unknown;
  __TAURI_INTERNALS__?: unknown;
}

/**
 * Whether the page runs inside a Tauri 2 window: `false` in a browser and on the server. Every
 * adapter checks this first, so the same app code ships to the web untouched.
 *
 * It reads the same `isTauri` global as `isTauri()` from `@tauri-apps/api/core`, and also
 * `__TAURI_INTERNALS__` (the IPC bridge itself), without importing the Tauri runtime.
 */
export function isTauri(): boolean {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false;
  const scope = globalThis as TauriGlobals;
  return Boolean(scope.isTauri) || (scope.__TAURI_INTERNALS__ ?? null) !== null;
}

/** The OS as the web view's user agent reports it. */
function platformFromUserAgent(): TauriPlatform {
  const agent = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(agent)) return 'ios';
  if (/Android/.test(agent)) return 'android';
  if (/Windows/.test(agent)) return 'windows';
  // iPadOS reports a desktop Mac; only it has a touch screen.
  if (/Macintosh|Mac OS X/.test(agent))
    return (navigator.maxTouchPoints ?? 0) > 1 ? 'ios' : 'macos';
  return 'linux';
}

/**
 * The OS around the Tauri window, or `null` in a browser and on the server. Pass
 * `@tauri-apps/plugin-os` for the answer from Rust; without it the web view's user agent decides,
 * which tells macOS, Windows and Linux apart reliably enough for styling.
 */
export function tauriPlatform(os?: OsPlugin): TauriPlatform | null {
  if (!isTauri()) return null;
  if (os) {
    try {
      return os.type();
    } catch {
      /* the plugin is installed in JS but not registered in Rust */
    }
  }
  return platformFromUserAgent();
}

/**
 * Writes `data-tauri-platform="macos"` (or `"windows"`, `"linux"`, …) on `<html>`, which
 * `styles.css` keys its desktop manners to and which your own CSS can use for a platform-specific
 * tweak. Returns the teardown. A no-op in a browser.
 */
export function markTauriPlatform(element?: HTMLElement, os?: OsPlugin): Teardown {
  const platform = tauriPlatform(os);
  const root = element ?? (typeof document === 'undefined' ? null : document.documentElement);
  if (!platform || !root) return noop;
  root.dataset.tauriPlatform = platform;
  return () => {
    delete root.dataset.tauriPlatform;
  };
}

/**
 * Most calls here are cosmetic — a window tint, a menu label. A rejection (a plugin missing from
 * the Rust side, a permission the capability file does not grant) must never surface as an
 * unhandled error.
 */
export function quietly(result: unknown): void {
  if (result && typeof (result as Promise<unknown>).catch === 'function') {
    (result as Promise<unknown>).catch(() => {});
  }
}

/**
 * Turns Tauri's promised unlisten function into a synchronous teardown. A teardown that runs
 * before the function arrives still unlistens once it does.
 */
export function listen(pending: Promise<UnlistenFn> | UnlistenFn): Teardown {
  let removed = false;
  let unlisten: UnlistenFn | undefined;
  Promise.resolve(pending).then(
    (resolved) => {
      if (removed) resolved();
      else unlisten = resolved;
    },
    () => {}
  );
  return () => {
    if (removed) return;
    removed = true;
    unlisten?.();
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
