import { SystemBars } from '@capacitor/core';
import { colorSchemeOf, observeColorScheme, readRoleColor } from '@loidolt/theme-svelte';
import { getContrastRatio, resolveRoles, type SemanticRole } from '@loidolt/theme-tokens';
import { nativePlatform, noop, quietly } from './platform.js';
import type { KeyboardStylePlugin, StatusBarPlugin, SystemBarsPlugin, Teardown } from './types.js';

/**
 * Capacitor's name for the icon colour of a system bar. Note the inversion: `DARK` is the style
 * for a dark bar, so its icons are light.
 */
export type SystemBarStyle = 'DARK' | 'LIGHT';

/**
 * The bar style that keeps the status icons readable over `color`: whichever of black or white
 * ink has the higher contrast against it. Accepts `#rrggbb` (an alpha suffix is ignored).
 */
export function systemBarStyleFor(color: string): SystemBarStyle {
  const opaque = color.slice(0, 7);
  return getContrastRatio('#000000', opaque) >= getContrastRatio('#ffffff', opaque)
    ? 'LIGHT'
    : 'DARK';
}

export interface NativeAppearanceOptions {
  /**
   * The colour role painted under the status bar. Defaults to `surface`, which is what `Topbar`
   * draws there; use `background` for a page with no top bar.
   */
  statusBarRole?: SemanticRole;
  /**
   * The colour role painted under the Android navigation bar and the iOS home indicator.
   * Defaults to `surface`, which is what `TabBar` draws there.
   */
  navigationBarRole?: SemanticRole;
  /** Where the theme is read from. Defaults to `<html>`. */
  element?: () => Element | null | undefined;
  /** Defaults to the `SystemBars` plugin bundled with `@capacitor/core`. */
  SystemBars?: SystemBarsPlugin;
  /**
   * `@capacitor/status-bar`, for an Android app that has opted out of edge-to-edge: the status
   * bar is then a separate native strip, and this paints it the `statusBarRole` colour. Leave it
   * out for edge-to-edge apps, where the page itself draws under the bar.
   */
  StatusBar?: StatusBarPlugin;
  /** `@capacitor/keyboard`, to give the iOS keyboard the dark or light appearance of the page. */
  Keyboard?: KeyboardStylePlugin;
}

/**
 * Keeps the native chrome in step with the page theme: status and navigation bar icons light on a
 * dark surface and dark on a light one, and the iOS keyboard in the matching appearance. It reads
 * the live colours, so a preset, a scoped override or an app's own theme decides the icons, and it
 * follows every theme change `createTheme` (or anything else) makes.
 *
 * ```ts
 * import { Keyboard } from '@capacitor/keyboard';
 * syncNativeAppearance({ Keyboard });
 * ```
 *
 * Returns the teardown. A no-op outside a native shell.
 */
export function syncNativeAppearance(options: NativeAppearanceOptions = {}): Teardown {
  const platform = nativePlatform();
  if (!platform) return noop;
  const {
    statusBarRole = 'surface',
    navigationBarRole = 'surface',
    SystemBars: systemBars = SystemBars,
    StatusBar,
    Keyboard,
  } = options;
  const target = () => options.element?.() ?? document.documentElement;

  const colorOf = (element: Element, role: SemanticRole) =>
    readRoleColor(element, role) ?? resolveRoles({ role }, colorSchemeOf(element)).role;

  // Only what changed is sent: every theme mutation lands here, most of them irrelevant.
  const last: Record<string, string> = {};
  const changed = (key: string, value: string) => {
    if (last[key] === value) return false;
    last[key] = value;
    return true;
  };

  const apply = () => {
    const element = target();
    if (!element) return;
    const statusColor = colorOf(element, statusBarRole);
    const status = systemBarStyleFor(statusColor);
    const navigation = systemBarStyleFor(colorOf(element, navigationBarRole));
    const scheme = colorSchemeOf(element);

    if (changed('status', status))
      quietly(systemBars.setStyle({ style: status, bar: 'StatusBar' }));
    if (changed('navigation', navigation)) {
      quietly(systemBars.setStyle({ style: navigation, bar: 'NavigationBar' }));
    }
    if (StatusBar) {
      if (changed('legacy', status)) quietly(StatusBar.setStyle({ style: status }));
      // iOS has no status bar background to paint; the page shows through.
      if (platform === 'android' && changed('legacyColor', statusColor)) {
        quietly(StatusBar.setBackgroundColor({ color: statusColor.slice(0, 7) }));
      }
    }
    if (Keyboard && changed('keyboard', scheme)) {
      quietly(Keyboard.setStyle({ style: scheme === 'dark' ? 'DARK' : 'LIGHT' }));
    }
  };

  apply();
  return observeColorScheme(apply);
}
