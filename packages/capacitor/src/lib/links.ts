import { colorSchemeOf, readRoleColor } from '@loidolt/theme-svelte';
import { resolveRoles, type SemanticRole } from '@loidolt/theme-tokens';
import { nativePlatform, quietly } from './platform.js';
import type { BrowserPlugin, Teardown } from './types.js';

export interface ExternalLinksOptions {
  /** `Browser` from `@capacitor/browser`. */
  Browser: BrowserPlugin;
  /**
   * Whether a link leaves the app. Defaults to any `http(s)` URL on another origin — the web
   * view's own origin is the app.
   */
  isExternal?: (url: URL, anchor: HTMLAnchorElement) => boolean;
  /**
   * The colour role the in-app browser's toolbar takes, read live so it matches the current
   * theme. Defaults to `surface`, the colour of `Topbar`; `null` leaves the system default.
   */
  toolbarRole?: SemanticRole | null;
  /** iOS only: `popover` opens a sheet rather than covering the app. Defaults to `fullscreen`. */
  presentationStyle?: 'fullscreen' | 'popover';
}

const defaultIsExternal = (url: URL) =>
  (url.protocol === 'http:' || url.protocol === 'https:') && url.origin !== location.origin;

/**
 * Opens links that leave the app in the system's in-app browser (SFSafariViewController, Chrome
 * Custom Tabs) instead of navigating the web view away from the app — which on iOS has no way
 * back. The toolbar takes the theme's colour.
 *
 * It is one delegated listener, so it covers every link, rendered Markdown included. A click
 * your own code has already handled (`preventDefault`), a modified click and a `download` link
 * are left alone. A no-op outside a native shell.
 */
export function openExternalLinks(options: ExternalLinksOptions): Teardown {
  if (!nativePlatform()) return () => {};
  const {
    Browser,
    isExternal = defaultIsExternal,
    toolbarRole = 'surface',
    presentationStyle = 'fullscreen',
  } = options;

  const toolbarColor = () => {
    if (toolbarRole === null) return undefined;
    const root = document.documentElement;
    const color =
      readRoleColor(root, toolbarRole) ??
      resolveRoles({ role: toolbarRole }, colorSchemeOf(root)).role;
    return color.slice(0, 7);
  };

  const onClick = (event: MouseEvent) => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target instanceof Element ? event.target : null;
    const anchor = target?.closest<HTMLAnchorElement>('a[href]');
    if (!anchor || anchor.hasAttribute('download')) return;
    let url: URL;
    try {
      url = new URL(anchor.href, location.href);
    } catch {
      return;
    }
    if (!isExternal(url, anchor)) return;
    event.preventDefault();
    quietly(Browser.open({ url: url.href, toolbarColor: toolbarColor(), presentationStyle }));
  };

  document.addEventListener('click', onClick);
  return () => document.removeEventListener('click', onClick);
}
