import { onDestroy } from 'svelte';

/** What the user chose. `system` defers to `prefers-color-scheme`. */
export type ThemePreference = 'light' | 'dark' | 'system';
/** What that choice resolves to right now — the value written to the DOM. */
export type ColorScheme = 'light' | 'dark';

export interface ThemeOptions {
  /** `localStorage` key holding the preference. Set to `null` to keep the choice in memory. */
  storageKey?: string | null;
  /** Attribute the resolved scheme is written to. Must match the stylesheet's selector. */
  attribute?: string;
  /** Element the attribute lands on. Defaults to `<html>`. */
  element?: HTMLElement | null;
  /** Preference before anything is stored. */
  defaultPreference?: ThemePreference;
  /** What `system` resolves to where `prefers-color-scheme` cannot be read (SSR, old engines). */
  defaultScheme?: ColorScheme;
  /**
   * Mirror the choice across tabs by listening for `storage` events. On by default; turn it off
   * if separate windows should be able to hold different themes.
   */
  sync?: boolean;
}

export interface Theme {
  /** The stored choice. Assignable: `theme.preference = 'dark'`. */
  preference: ThemePreference;
  /** The scheme in force — `preference`, or the system scheme when that is `system`. */
  readonly resolved: ColorScheme;
  /** What the system currently prefers, regardless of the choice. */
  readonly system: ColorScheme;
  /** Flips between explicit light and dark, starting from whatever is showing. */
  toggle(): void;
  /** Removes the media and storage listeners. Automatic for a component-scoped instance. */
  destroy(): void;
}

const SCHEMES: readonly ThemePreference[] = ['light', 'dark', 'system'];

const isPreference = (value: unknown): value is ThemePreference =>
  typeof value === 'string' && (SCHEMES as readonly string[]).includes(value);

/**
 * Theme state: the stored preference, the system preference, and the resolved scheme written to
 * the DOM.
 *
 * ```ts
 * // src/lib/theme.ts — one instance for the app
 * import { createTheme } from '@loidolt/theme-svelte';
 * export const theme = createTheme();
 * ```
 *
 * ```svelte
 * <button onclick={theme.toggle}>{theme.resolved === 'dark' ? 'Light' : 'Dark'} mode</button>
 * ```
 *
 * The **resolved** scheme is always written out, even for `system`, so the same store drives
 * both `@loidolt/theme-styles/dark` (attribute-only) and `/dark-auto` (which also follows
 * `prefers-color-scheme`): an explicit `data-theme="light"` is exactly what `dark-auto` expects
 * to see when a user overrides a dark system.
 *
 * Pair it with {@link themeScript} in `app.html`, or the first paint of a reload is light.
 */
export function createTheme(options: ThemeOptions = {}): Theme {
  const {
    storageKey = 'loidolt-theme',
    attribute = 'data-theme',
    element,
    defaultPreference = 'system',
    defaultScheme = 'light',
    sync = true,
  } = options;

  const browser = typeof document !== 'undefined';
  const target = element ?? (browser ? document.documentElement : null);

  const read = (): ThemePreference => {
    if (!browser || storageKey === null) return defaultPreference;
    try {
      const stored = localStorage.getItem(storageKey);
      return isPreference(stored) ? stored : defaultPreference;
    } catch {
      // Storage can throw outright in a partitioned iframe or with cookies blocked. A theme is
      // not worth breaking the page over — fall back to the default and keep the choice in memory.
      return defaultPreference;
    }
  };

  let preference = $state(read());
  let system = $state<ColorScheme>(defaultScheme);

  let media: MediaQueryList | undefined;
  const onSystemChange = (event: MediaQueryList | MediaQueryListEvent) => {
    system = event.matches ? 'dark' : 'light';
    apply();
  };

  if (browser && typeof window.matchMedia === 'function') {
    media = window.matchMedia('(prefers-color-scheme: dark)');
    system = media.matches ? 'dark' : 'light';
    media.addEventListener('change', onSystemChange);
  }

  const resolve = (): ColorScheme => (preference === 'system' ? system : preference);

  function apply() {
    target?.setAttribute(attribute, resolve());
  }

  const onStorage = (event: StorageEvent) => {
    if (event.key !== storageKey) return;
    // A cleared key means another tab reset to the default rather than picking a scheme.
    preference = isPreference(event.newValue) ? event.newValue : defaultPreference;
    apply();
  };

  if (browser && sync && storageKey !== null) window.addEventListener('storage', onStorage);

  // Written on creation, not in an effect: `createTheme()` is meant to be callable at module
  // scope, where there is no reactive context to own an effect.
  apply();

  function set(next: ThemePreference) {
    preference = next;
    if (browser && storageKey !== null) {
      try {
        localStorage.setItem(storageKey, next);
      } catch {
        /* see `read`: unavailable storage degrades to a memory-only choice */
      }
    }
    apply();
  }

  const destroy = () => {
    media?.removeEventListener('change', onSystemChange);
    media = undefined;
    if (browser && sync && storageKey !== null) window.removeEventListener('storage', onStorage);
  };

  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get preference() {
      return preference;
    },
    set preference(next: ThemePreference) {
      set(next);
    },
    get resolved() {
      return resolve();
    },
    get system() {
      return system;
    },
    toggle() {
      set(resolve() === 'dark' ? 'light' : 'dark');
    },
    destroy,
  };
}

export interface ThemeScriptOptions extends Pick<
  ThemeOptions,
  'storageKey' | 'attribute' | 'defaultPreference' | 'defaultScheme'
> {
  /** Wrap the source in a `<script>` tag. Off by default, so it can go inside your own tag. */
  tag?: boolean;
}

/**
 * The blocking snippet that stops the light-mode flash on reload. It performs the same resolve
 * as {@link createTheme} — read the stored preference, fall back to `prefers-color-scheme`,
 * write the attribute — before the browser paints.
 *
 * It must run **synchronously in `<head>`, before the stylesheet's first paint**. A module
 * script, a `defer`ed script, or anything in `<body>` is too late by definition.
 *
 * ```html
 * <!-- src/app.html -->
 * <head>
 *   %sveltekit.head%
 *   <script>__LOIDOLT_THEME__</script>
 * </head>
 * ```
 *
 * ```ts
 * // src/hooks.server.ts
 * import { themeScript } from '@loidolt/theme-svelte';
 * export const handle = ({ event, resolve }) =>
 *   resolve(event, { transformPageChunk: ({ html }) => html.replace('__LOIDOLT_THEME__', themeScript()) });
 * ```
 *
 * Returns source only unless `tag` is set. The output contains no `<` at all, so it is safe to
 * inline in an HTML `<script>` element without further escaping.
 */
export function themeScript(options: ThemeScriptOptions = {}): string {
  const {
    storageKey = 'loidolt-theme',
    attribute = 'data-theme',
    defaultPreference = 'system',
    defaultScheme = 'light',
    tag = false,
  } = options;

  // JSON string escaping alone leaves `<` intact, including a literal `</script>` that would end
  // an inline script element. Escaping HTML-significant characters and the two JavaScript line
  // separators keeps every option inside its string literal in both source-only and tagged forms.
  const serialize = (value: string | null) =>
    JSON.stringify(value)
      .replaceAll('<', '\\u003c')
      .replaceAll('>', '\\u003e')
      .replaceAll('&', '\\u0026')
      .replaceAll('\u2028', '\\u2028')
      .replaceAll('\u2029', '\\u2029');

  const key = serialize(storageKey);
  const attr = serialize(attribute);
  const fallback = serialize(defaultPreference);
  const scheme = serialize(defaultScheme);

  const source =
    `(function(){try{` +
    `var p=${fallback};` +
    // Storage failure must not skip system resolution and attribute application.
    `try{var v=${key}===null?null:localStorage.getItem(${key});` +
    `if(v==="light"||v==="dark"||v==="system")p=v;}catch(e){}` +
    `var s=${scheme};` +
    `if(typeof matchMedia==="function")s=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";` +
    `document.documentElement.setAttribute(${attr},p==="system"?s:p);` +
    // A theme is cosmetic; a throw here would abort a blocking head script and take the page
    // down with it. Swallow and let the stylesheet's own default stand.
    `}catch(e){}})()`;

  return tag ? `<script>${source}</script>` : source;
}
