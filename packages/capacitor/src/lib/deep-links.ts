import { listen, nativePlatform } from './platform.js';
import type { AppUrlPlugin, Teardown } from './types.js';

/**
 * The in-app path for a URL that opened the app. An `https://` universal or app link keeps its
 * path; a custom scheme has no host in the usual sense, so `myapp://projects/42` becomes
 * `/projects/42`. Query and hash are kept.
 */
export function deepLinkPath(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  const web = parsed.protocol === 'http:' || parsed.protocol === 'https:';
  const path = web ? parsed.pathname : `/${parsed.host}${parsed.pathname}`.replace(/\/{2,}/g, '/');
  return `${path || '/'}${parsed.search}${parsed.hash}`;
}

export interface DeepLinkOptions {
  /** `App` from `@capacitor/app`. */
  App: AppUrlPlugin;
  /** Your router's navigation — `goto` in SvelteKit. */
  navigate: (path: string) => void;
  /** Turns the opening URL into an in-app path, or `null` to ignore it. Defaults to {@link deepLinkPath}. */
  resolve?: (url: string) => string | null;
}

/** Routes universal links, app links and custom-scheme URLs into the app's own router. */
export function handleDeepLinks(options: DeepLinkOptions): Teardown {
  if (!nativePlatform()) return () => {};
  const { App, navigate, resolve = deepLinkPath } = options;
  return listen(
    App.addListener('appUrlOpen', ({ url }) => {
      const path = resolve(url);
      if (path !== null) navigate(path);
    })
  );
}
