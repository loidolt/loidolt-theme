import {
  colorSchemeOf,
  observeColorScheme,
  readRoleColor,
  type Theme,
} from '@loidolt/theme-svelte';
import { darkSemantic, resolveRoles, semantic, type SemanticRole } from '@loidolt/theme-tokens';
import { combine, listen, noop, quietly, tauriPlatform } from './platform.js';
import type { OsPlugin, Teardown, WindowPlugin, WindowTheme } from './types.js';

/** Window chrome is a desktop affair: Tauri's mobile targets have no title bar or window colour. */
function desktopPlatform(os?: OsPlugin) {
  const platform = tauriPlatform(os);
  return platform === 'macos' || platform === 'windows' || platform === 'linux' ? platform : null;
}

/**
 * The theme's own page background, for `backgroundColor` in `tauri.conf.json`: the colour the
 * window is filled with before the page's first frame. Match the theme most people launch in —
 * `light` (the default) for a light-first app. With the window starting hidden (see
 * {@link showWindow}) it only shows where the web view paints late.
 */
export function windowBackground(scheme: 'light' | 'dark' = 'light'): string {
  return (scheme === 'dark' ? darkSemantic : semantic).background;
}

export interface WindowAppearanceOptions {
  /** The window: `getCurrentWindow()` from `@tauri-apps/api/window`. */
  window: WindowPlugin;
  /**
   * The app's `createTheme` store. With it, an explicit light or dark choice reaches the native
   * window (title bar, menus, dialogs, scroll bars) and `system` hands the appearance back to the
   * OS. Without it the window's appearance is left to the OS: pinning it from the page alone
   * would also pin the web view's `prefers-color-scheme`, and a `system` theme would stop
   * following the OS.
   */
  theme?: Theme;
  /**
   * The colour role the window is filled with: what shows before the page paints, while it
   * resizes and behind a transparent page. Defaults to `background`, which the page body paints.
   */
  backgroundRole?: SemanticRole;
  /** Where the theme is read from. Defaults to `<html>`. */
  element?: () => Element | null | undefined;
}

export interface WindowAppearance {
  /** Settles once the first background and appearance have reached the window. Never rejects. */
  readonly ready: Promise<void>;
  destroy(): void;
}

const settled = (calls: Array<Promise<void>>) =>
  Promise.all(calls.map((call) => call.catch(() => {}))).then(() => {});

/**
 * Keeps the window in step with the page theme: its background in the live `background` colour,
 * so there is no white flash before the first frame or while resizing a dark window, and, given
 * the `createTheme` store, its native light or dark appearance. It reads the live colour, so a
 * preset or an app's own theme decides, and it follows every theme and preset change.
 *
 * ```ts
 * import { getCurrentWindow } from '@tauri-apps/api/window';
 * // getCurrentWindow() reads the Tauri runtime, so check first in code that also runs in a browser
 * if (isTauri()) syncWindowAppearance({ window: getCurrentWindow(), theme });
 * ```
 *
 * A no-op outside a Tauri desktop window.
 */
export function syncWindowAppearance(
  options: WindowAppearanceOptions,
  os?: OsPlugin
): WindowAppearance {
  if (!desktopPlatform(os)) return { ready: Promise.resolve(), destroy: noop };
  const { window: win, theme, backgroundRole = 'background' } = options;
  const target = () => options.element?.() ?? document.documentElement;

  // Only what changed is sent: every theme mutation lands here, most of them irrelevant.
  const last: Record<string, string | null> = {};
  const changed = (key: string, value: string | null) => {
    if (key in last && last[key] === value) return false;
    last[key] = value;
    return true;
  };

  const apply = (): Array<Promise<void>> => {
    const calls: Array<Promise<void>> = [];
    const element = target();
    const color = (
      readRoleColor(element, backgroundRole) ??
      resolveRoles({ role: backgroundRole }, colorSchemeOf(element)).role
    ).slice(0, 7); // opaque: Windows ignores alpha, and a window is never see-through by accident
    if (changed('background', color)) calls.push(win.setBackgroundColor(color));
    if (theme) {
      const appearance: WindowTheme | null = theme.preference === 'system' ? null : theme.resolved;
      if (changed('theme', appearance)) calls.push(win.setTheme(appearance));
    }
    for (const call of calls) quietly(call);
    return calls;
  };

  const ready = settled(apply());
  const teardowns: Teardown[] = [observeColorScheme(apply)];
  // Going back to `system` while the system matches the old choice changes no attribute, so the
  // preference itself is watched too.
  if (theme) {
    teardowns.push(
      $effect.root(() => {
        $effect(() => {
          void theme.preference;
          apply();
        });
      })
    );
  }

  return { ready, destroy: combine(...teardowns) };
}

export interface WindowChromeOptions {
  /** The window: `getCurrentWindow()` from `@tauri-apps/api/window`. */
  window: WindowPlugin;
  /**
   * The title bar `tauri.conf.json` gives the window. `overlay` (`"titleBarStyle": "Overlay"`,
   * with `"hiddenTitle": true`) draws the page under a transparent macOS title bar, and the page
   * is inset to clear the window buttons. `native` (the default) leaves the page alone.
   */
  titleBar?: 'overlay' | 'native';
  /**
   * Where the macOS window buttons sit under an overlay title bar. `above` (the default): in a
   * strip of their own across the top, which the safe-area top inset (`--ldt-safe-top`) reserves —
   * `Topbar` grows by it, and drawers and toasts clear it. `beside`: in the `Topbar` row itself,
   * which is inset from the left (`--ldt-safe-left`, on the bar only) instead; move the buttons
   * into the bar's middle with `trafficLightPosition` in `tauri.conf.json`.
   */
  trafficLights?: 'above' | 'beside';
  /** The strip reserved for `above`. Defaults to `28px`, the height of a macOS title bar. */
  top?: string;
  /** The room left for `beside`. Defaults to `78px`, the width of the three buttons and a gap. */
  left?: string;
}

/**
 * Makes room for the macOS window buttons under an overlay title bar, through the theme's
 * safe-area knobs, and gives it back in full screen, where the buttons hide. `<html>` carries
 * `data-tauri-traffic-lights="above"` (or `"beside"`) while they show, for CSS of your own.
 *
 * ```ts
 * import { getCurrentWindow } from '@tauri-apps/api/window';
 * if (isTauri()) insetWindowChrome({ window: getCurrentWindow(), titleBar: 'overlay' });
 * ```
 *
 * Returns the teardown. A no-op on Windows, Linux, and outside a Tauri window, and with a
 * `native` title bar.
 */
export function insetWindowChrome(options: WindowChromeOptions, os?: OsPlugin): Teardown {
  if (options.titleBar !== 'overlay' || desktopPlatform(os) !== 'macos') return noop;
  const { window: win, trafficLights = 'above', top = '28px', left = '78px' } = options;
  const root = document.documentElement;
  const property = trafficLights === 'above' ? '--ldt-safe-top' : '--ldt-tauri-traffic-lights';
  const value = trafficLights === 'above' ? top : left;
  const previous = root.style.getPropertyValue(property);

  const unset = () => {
    delete root.dataset.tauriTrafficLights;
    if (previous) root.style.setProperty(property, previous);
    else root.style.removeProperty(property);
  };
  const write = (fullscreen: boolean) => {
    if (fullscreen) return unset();
    root.dataset.tauriTrafficLights = trafficLights;
    root.style.setProperty(property, value);
  };

  let stopped = false;
  const check = () =>
    quietly(
      win.isFullscreen().then((fullscreen) => {
        if (!stopped) write(fullscreen);
      })
    );

  // Windowed until told otherwise: that is how an app launches, and the inset is then right
  // from the first frame.
  write(false);
  check();
  const unlisten = listen(win.onResized(check));

  return () => {
    if (stopped) return;
    stopped = true;
    unlisten();
    unset();
  };
}

export interface ShowWindowOptions {
  /** The window: `getCurrentWindow()` from `@tauri-apps/api/window`. */
  window: WindowPlugin;
  /** Waited for before the window shows — the theme applied, the first data. */
  until?: Promise<unknown>;
  /** Wait for the bundled faces to load, so no fallback text flashes. Defaults to `true`. */
  waitForFonts?: boolean;
  /** Longest wait in milliseconds before showing anyway. Defaults to 3000. */
  timeout?: number;
}

/**
 * Shows a window that starts hidden (`"visible": false` in `tauri.conf.json`) once the page is
 * ready to be seen — the theme applied to the page and the window, the fonts in — so it opens
 * on the app rather than on a white or wrong-theme flash. Never rejects; a no-op outside a
 * Tauri desktop window, and harmless on a window that is already visible.
 */
export async function showWindow(options: ShowWindowOptions, os?: OsPlugin): Promise<void> {
  if (!desktopPlatform(os)) return;
  const { window: win, until, waitForFonts = true, timeout = 3000 } = options;
  const waits: Array<Promise<unknown>> = [];
  if (until) waits.push(until.catch(() => {}));
  if (waitForFonts && document.fonts) waits.push(document.fonts.ready.catch(() => {}));
  let timer: ReturnType<typeof setTimeout> | undefined;
  // No animation frames here: a hidden window may never get one.
  await Promise.race([
    Promise.all(waits),
    new Promise<void>((resolve) => {
      timer = setTimeout(resolve, timeout);
    }),
  ]);
  clearTimeout(timer);
  try {
    await win.show();
  } catch {
    /* `core:window:allow-show` missing from the capability: nothing more to do from here */
  }
}
