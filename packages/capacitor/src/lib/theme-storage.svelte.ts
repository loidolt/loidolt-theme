import type { Theme, ThemePreference } from '@loidolt/theme-svelte';
import { nativePlatform, quietly } from './platform.js';
import type { PreferencesPlugin, Teardown } from './types.js';

export interface PersistThemeOptions {
  /** `Preferences` from `@capacitor/preferences`. */
  Preferences: PreferencesPlugin;
  /** Key for the colour scheme. Defaults to `createTheme`'s own storage key. */
  key?: string;
  /** Key for the preset, when the theme has presets. Defaults to `createTheme`'s own. */
  presetKey?: string;
}

export interface PersistedTheme {
  /**
   * Settles once the stored choice has been read and applied — await it before hiding the splash
   * screen, so the first frame anyone sees is already in their theme.
   */
  readonly ready: Promise<void>;
  destroy: Teardown;
}

const PREFERENCES: readonly string[] = ['light', 'dark', 'system'] satisfies ThemePreference[];

/**
 * Backs a `createTheme` store with native storage. iOS may evict a web view's `localStorage`
 * under storage pressure, which would quietly reset everyone's dark mode; `Preferences` lives in
 * `UserDefaults` and `SharedPreferences` and does not. The theme still writes `localStorage` too,
 * so `themeScript()` paints the first frame from it as usual — this restores and mirrors.
 *
 * ```ts
 * import { Preferences } from '@capacitor/preferences';
 * export const theme = createTheme({ presets: ['loidolt', 'soft'] });
 * persistTheme(theme, { Preferences });
 * ```
 *
 * A no-op outside a native shell (`ready` resolves at once).
 */
export function persistTheme(theme: Theme, options: PersistThemeOptions): PersistedTheme {
  if (!nativePlatform()) return { ready: Promise.resolve(), destroy: () => {} };
  const { Preferences, key = 'loidolt-theme', presetKey = 'loidolt-preset' } = options;
  const hasPresets = theme.presets.length > 0;

  const read = (name: string) =>
    Preferences.get({ key: name }).then(
      ({ value }) => value,
      () => null
    );

  // Nothing is written until the stored value has been read, or the default the theme started
  // with would overwrite the choice it was about to restore.
  let hydrated = $state(false);
  let stopped = false;

  const ready = Promise.all([read(key), hasPresets ? read(presetKey) : null]).then(
    ([preference, preset]) => {
      if (stopped) return;
      if (preference !== null && PREFERENCES.includes(preference)) {
        if (theme.preference !== preference) theme.preference = preference as ThemePreference;
      }
      if (preset !== null && theme.presets.includes(preset) && theme.preset !== preset) {
        theme.preset = preset;
      }
      hydrated = true;
    }
  );

  const stop = $effect.root(() => {
    $effect(() => {
      const preference = theme.preference;
      if (hydrated) quietly(Preferences.set({ key, value: preference }));
    });
    $effect(() => {
      const preset = theme.preset;
      if (hydrated && hasPresets && preset !== undefined) {
        quietly(Preferences.set({ key: presetKey, value: preset }));
      }
    });
  });

  return {
    ready,
    destroy() {
      stopped = true;
      stop();
    },
  };
}
