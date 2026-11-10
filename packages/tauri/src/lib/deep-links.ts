import { isTauri, listen, noop } from './platform.js';
import type { DeepLinkPlugin, Teardown } from './types.js';

/**
 * The in-app path for a URL that opened the app. An `https://` link keeps its path; a custom
 * scheme has no host in the usual sense, so `myapp://projects/42` becomes `/projects/42`. Query
 * and hash are kept. `null` for something that is not a URL, and for a `file:` URL: on macOS a
 * file opened from the Finder arrives the same way, and it is not a route.
 */
export function deepLinkPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol === 'file:') return null;
  const web = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  const path = web ? parsed.pathname : `/${parsed.host}${parsed.pathname}`.replace(/\/{2,}/g, '/');
  return `${path || '/'}${parsed.search}${parsed.hash}`;
}

export interface DeepLinkOptions {
  /** `@tauri-apps/plugin-deep-link`. */
  deepLink: DeepLinkPlugin;
  /** Your router's navigation — `goto` in SvelteKit — called with each link's in-app path. */
  navigate?: (path: string) => void;
  /** Called with each raw URL, before `navigate`. */
  onUrl?: (url: string) => void;
  /** Turns a URL into an in-app path, or `null` to skip `navigate`. Defaults to {@link deepLinkPath}. */
  resolve?: (url: string) => string | null;
}

/**
 * Routes the URLs that open the app (`myapp://…`) into its own router: the one that launched it,
 * read once at startup, and every one that arrives while it runs. A no-op outside a Tauri window.
 */
export function handleDeepLinks(options: DeepLinkOptions): Teardown {
  if (!isTauri()) return noop;
  const { deepLink, navigate, onUrl, resolve = deepLinkPath } = options;
  let stopped = false;
  let live = false;

  const open = (urls: string[] | null) => {
    if (stopped || !Array.isArray(urls)) return;
    for (const url of urls) {
      onUrl?.(url);
      const path = navigate ? resolve(url) : null;
      if (path !== null) navigate!(path);
    }
  };

  let unlisten: Teardown = noop;
  try {
    unlisten = listen(
      deepLink.onOpenUrl((urls) => {
        live = true;
        open(urls);
      })
    );
    deepLink.getCurrent().then(
      // A link that arrived while this was in flight is newer than the one that launched the app.
      (urls) => {
        if (!live) open(urls);
      },
      () => {}
    );
  } catch {
    /* the plugin is installed in JS but not registered in Rust */
  }

  return () => {
    stopped = true;
    unlisten();
  };
}
