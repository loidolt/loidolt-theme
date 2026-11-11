/*
 * `@loidolt/theme-capacitor/config` — for `capacitor.config.ts`, which the Capacitor CLI runs in
 * Node. Plain data from the tokens: no DOM, no Svelte, no Capacitor runtime.
 */
import { darkSemantic, semantic } from '@loidolt/theme-tokens';

export interface ThemeConfigOptions {
  /**
   * Which reference theme the launch is painted in: the colour behind the web view before its
   * first frame. Match the theme most people will see — `light` (the default) for a light-first
   * app. The splash screen itself is the native launch screen's (see the README).
   */
  scheme?: 'light' | 'dark';
  /** A colour of your own instead of the theme's `background`. */
  backgroundColor?: string;
  /**
   * How the web view makes room for the keyboard. `native` (the default) shrinks it, which the
   * theme handles with no further help; `none` overlays the page, and `createNativeKeyboard` then
   * lifts the bottom chrome by the keyboard's height.
   */
  keyboardResize?: 'native' | 'body' | 'ionic' | 'none';
}

/** The slice of `CapacitorConfig` this touches — structurally, so `@capacitor/cli` is not needed. */
export interface ThemeConfig {
  backgroundColor: string;
  ios: { backgroundColor: string };
  android: { backgroundColor: string };
  plugins: {
    SystemBars: { insetsHandling: 'css' };
    SplashScreen: { launchAutoHide: false };
    Keyboard: { resize: NonNullable<ThemeConfigOptions['keyboardResize']> };
  };
}

/**
 * The Capacitor settings the theme expects:
 *
 * - The launch background in the theme's colour, so there is no white flash before a dark app's
 *   first frame (or the reverse).
 * - `SystemBars` injecting the safe-area variables `styles.css` reads on older Android web views.
 * - A splash screen that waits for `hideSplashScreen` (or `setupCapacitor`), which lifts it once
 *   the stored theme and the fonts are in. Its colour is left to the native launch screen: the
 *   plugin's `backgroundColor` would paint one fixed colour over it, and on iOS hide a launch
 *   colour that follows dark mode.
 * - The keyboard resize mode.
 */
export function themeConfig(options: ThemeConfigOptions = {}): ThemeConfig {
  const { scheme = 'light', keyboardResize = 'native' } = options;
  const backgroundColor =
    options.backgroundColor ?? (scheme === 'dark' ? darkSemantic : semantic).background;
  return {
    backgroundColor,
    ios: { backgroundColor },
    android: { backgroundColor },
    plugins: {
      SystemBars: { insetsHandling: 'css' },
      SplashScreen: { launchAutoHide: false },
      Keyboard: { resize: keyboardResize },
    },
  };
}

type Section = Record<string, unknown>;

/**
 * Your config with {@link themeConfig} underneath it: everything you set wins, down to single
 * plugin options, and everything you leave out comes from the theme.
 *
 * ```ts
 * // capacitor.config.ts
 * import type { CapacitorConfig } from '@capacitor/cli';
 * import { withTheme } from '@loidolt/theme-capacitor/config';
 *
 * export default withTheme<CapacitorConfig>({
 *   appId: 'space.loidolt.topostack',
 *   appName: 'Topostack',
 *   webDir: 'build',
 * });
 * ```
 */
export function withTheme<C extends object>(config: C, options: ThemeConfigOptions = {}): C {
  const theme = themeConfig(options);
  const own = config as Section & {
    ios?: Section;
    android?: Section;
    plugins?: Record<string, Section | undefined>;
  };
  const plugins: Record<string, Section | undefined> = { ...own.plugins };
  for (const [name, defaults] of Object.entries(theme.plugins)) {
    plugins[name] = { ...defaults, ...own.plugins?.[name] };
  }
  return {
    ...config,
    backgroundColor: own.backgroundColor ?? theme.backgroundColor,
    ios: { ...theme.ios, ...own.ios },
    android: { ...theme.android, ...own.android },
    plugins,
  };
}
