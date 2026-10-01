import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { breakpointQuery, createMediaQuery } from '../src/lib/media.svelte.js';
import { createTheme, themeScript } from '../src/lib/theme.svelte.js';

/**
 * jsdom ships no `matchMedia`, and tests/setup.ts installs a permanently-false stub. These
 * suites need one they can flip, so they install a controllable fake and restore afterwards.
 */
type Listener = (event: { matches: boolean }) => void;

function fakeMatchMedia(initial: Record<string, boolean> = {}) {
  const state = new Map(Object.entries(initial));
  const listeners = new Map<string, Set<Listener>>();

  const impl = (query: string) => ({
    get matches() {
      return state.get(query) ?? false;
    },
    media: query,
    addEventListener: (_: string, listener: Listener) => {
      if (!listeners.has(query)) listeners.set(query, new Set());
      listeners.get(query)!.add(listener);
    },
    removeEventListener: (_: string, listener: Listener) => {
      listeners.get(query)?.delete(listener);
    },
    dispatchEvent: () => true,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
  });

  return {
    install() {
      window.matchMedia = impl as unknown as typeof window.matchMedia;
    },
    set(query: string, matches: boolean) {
      state.set(query, matches);
      for (const listener of listeners.get(query) ?? []) listener({ matches });
    },
    listenerCount(query: string) {
      return listeners.get(query)?.size ?? 0;
    },
  };
}

const DARK = '(prefers-color-scheme: dark)';

const original = window.matchMedia;

afterEach(() => {
  window.matchMedia = original;
  document.documentElement.removeAttribute('data-theme');
  document.documentElement.removeAttribute('data-preset');
  localStorage.clear();
});

describe('createTheme', () => {
  let media: ReturnType<typeof fakeMatchMedia>;

  beforeEach(() => {
    media = fakeMatchMedia({ [DARK]: false });
    media.install();
  });

  it('defaults to the system preference and writes the resolved scheme', () => {
    const theme = createTheme();

    expect(theme.preference).toBe('system');
    expect(theme.resolved).toBe('light');
    // The resolved value is written even for `system`, so `dark-auto` sees an explicit light.
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    theme.destroy();
  });

  it('follows the system while the preference is `system`', () => {
    const theme = createTheme();

    media.set(DARK, true);
    expect(theme.system).toBe('dark');
    expect(theme.resolved).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    theme.destroy();
  });

  it('stops following the system once a scheme is chosen', () => {
    const theme = createTheme();

    theme.preference = 'light';
    media.set(DARK, true);

    expect(theme.system).toBe('dark');
    expect(theme.resolved).toBe('light');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    theme.destroy();
  });

  it('persists the choice and restores it', () => {
    const first = createTheme();
    first.preference = 'dark';
    expect(localStorage.getItem('loidolt-theme')).toBe('dark');
    first.destroy();

    const second = createTheme();
    expect(second.preference).toBe('dark');
    expect(second.resolved).toBe('dark');
    second.destroy();
  });

  it('toggles from what is showing, not from the stored preference', () => {
    media.set(DARK, true);
    const theme = createTheme();

    // Preference is `system`, resolving dark — one toggle must land on light, not dark.
    expect(theme.resolved).toBe('dark');
    theme.toggle();
    expect(theme.preference).toBe('light');

    theme.toggle();
    expect(theme.preference).toBe('dark');

    theme.destroy();
  });

  it('ignores a stored value that is not a preference', () => {
    localStorage.setItem('loidolt-theme', 'chartreuse');
    const theme = createTheme();
    expect(theme.preference).toBe('system');
    theme.destroy();
  });

  it('mirrors another tab through the storage event', () => {
    const theme = createTheme();

    window.dispatchEvent(new StorageEvent('storage', { key: 'loidolt-theme', newValue: 'dark' }));
    expect(theme.preference).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    // A cleared key means the other tab reset to the default.
    window.dispatchEvent(new StorageEvent('storage', { key: 'loidolt-theme', newValue: null }));
    expect(theme.preference).toBe('system');

    // An unrelated key must not move the theme.
    window.dispatchEvent(new StorageEvent('storage', { key: 'cart', newValue: 'dark' }));
    expect(theme.preference).toBe('system');

    theme.destroy();
  });

  it('keeps the choice in memory when storage is disabled', () => {
    const theme = createTheme({ storageKey: null });
    theme.preference = 'dark';

    expect(localStorage.getItem('loidolt-theme')).toBeNull();
    expect(theme.resolved).toBe('dark');

    theme.destroy();
  });

  it('survives storage that throws', () => {
    const getItem = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    const theme = createTheme();
    expect(theme.preference).toBe('system');
    expect(() => (theme.preference = 'dark')).not.toThrow();
    expect(theme.resolved).toBe('dark');

    theme.destroy();
    getItem.mockRestore();
    setItem.mockRestore();
  });

  it('honours a custom attribute and element', () => {
    const element = document.createElement('div');
    const theme = createTheme({ attribute: 'data-mode', element, storageKey: null });

    theme.preference = 'dark';
    expect(element).toHaveAttribute('data-mode', 'dark');
    expect(document.documentElement).not.toHaveAttribute('data-theme');

    theme.destroy();
  });

  it('releases its listeners on destroy', () => {
    const theme = createTheme();
    expect(media.listenerCount(DARK)).toBe(1);

    theme.destroy();
    expect(media.listenerCount(DARK)).toBe(0);

    media.set(DARK, true);
    expect(theme.resolved).toBe('light');
  });
});

describe('createTheme preset axis', () => {
  beforeEach(() => fakeMatchMedia({ [DARK]: false }).install());

  const presets = ['loidolt', 'soft', 'compact'] as const;

  it('leaves the preset attribute alone unless presets are given', () => {
    document.documentElement.setAttribute('data-preset', 'soft');
    const theme = createTheme();

    expect(theme.preset).toBeUndefined();
    expect(theme.presets).toEqual([]);
    theme.preset = 'compact';
    expect(theme.preset).toBeUndefined();
    expect(document.documentElement).toHaveAttribute('data-preset', 'soft');
    expect(localStorage.getItem('loidolt-preset')).toBeNull();

    theme.destroy();
  });

  it('writes the first preset by default, beside the scheme', () => {
    const theme = createTheme({ presets });

    expect(theme.preset).toBe('loidolt');
    expect(document.documentElement).toHaveAttribute('data-preset', 'loidolt');
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');

    theme.destroy();
  });

  it('persists the preset under its own key and restores it', () => {
    const first = createTheme({ presets, defaultPreset: 'compact' });
    expect(first.preset).toBe('compact');
    first.preset = 'soft';
    first.preference = 'dark';
    expect(localStorage.getItem('loidolt-preset')).toBe('soft');
    expect(localStorage.getItem('loidolt-theme')).toBe('dark');
    first.destroy();

    const second = createTheme({ presets });
    expect(second.preset).toBe('soft');
    expect(second.resolved).toBe('dark');
    second.destroy();
  });

  it('ignores names outside the preset list, assigned or stored', () => {
    localStorage.setItem('loidolt-preset', 'brutalist');
    const theme = createTheme({ presets });
    expect(theme.preset).toBe('loidolt');

    // @ts-expect-error not one of the presets
    theme.preset = 'brutalist';
    expect(theme.preset).toBe('loidolt');
    expect(document.documentElement).toHaveAttribute('data-preset', 'loidolt');

    theme.destroy();
  });

  it('rejects a default that is not one of the presets', () => {
    // @ts-expect-error not one of the presets
    expect(() => createTheme({ presets, defaultPreset: 'brutalist' })).toThrow(/defaultPreset/);
  });

  it('mirrors a preset chosen in another tab', () => {
    const theme = createTheme({ presets });

    window.dispatchEvent(new StorageEvent('storage', { key: 'loidolt-preset', newValue: 'soft' }));
    expect(theme.preset).toBe('soft');
    expect(document.documentElement).toHaveAttribute('data-preset', 'soft');

    window.dispatchEvent(new StorageEvent('storage', { key: 'loidolt-preset', newValue: null }));
    expect(theme.preset).toBe('loidolt');

    theme.destroy();
  });

  it('honours a custom attribute and storage key', () => {
    const theme = createTheme({
      presets,
      presetAttribute: 'data-style',
      presetStorageKey: null,
    });
    theme.preset = 'compact';
    expect(document.documentElement).toHaveAttribute('data-style', 'compact');
    expect(localStorage.getItem('loidolt-preset')).toBeNull();

    theme.destroy();
    document.documentElement.removeAttribute('data-style');
  });
});

describe('themeScript', () => {
  /** Runs the generated source against a stub document, the way a head script would. */
  function run(source: string, stored: string | null | Error, prefersDark: boolean) {
    const set = vi.fn();
    const fn = new Function('localStorage', 'matchMedia', 'document', `${source};`) as (
      storage: { getItem: (key: string) => string | null },
      matcher: ((query: string) => { matches: boolean }) | undefined,
      doc: { documentElement: { setAttribute: typeof set } }
    ) => void;

    fn(
      {
        getItem: () =>
          stored instanceof Error
            ? (() => {
                throw stored;
              })()
            : stored,
      },
      prefersDark === undefined ? undefined : () => ({ matches: prefersDark }),
      { documentElement: { setAttribute: set } }
    );
    return set;
  }

  it('writes the stored preference', () => {
    expect(run(themeScript(), 'dark', false)).toHaveBeenCalledWith('data-theme', 'dark');
    expect(run(themeScript(), 'light', true)).toHaveBeenCalledWith('data-theme', 'light');
  });

  it('resolves `system` against prefers-color-scheme', () => {
    expect(run(themeScript(), 'system', true)).toHaveBeenCalledWith('data-theme', 'dark');
    expect(run(themeScript(), null, true)).toHaveBeenCalledWith('data-theme', 'dark');
    expect(run(themeScript(), null, false)).toHaveBeenCalledWith('data-theme', 'light');
  });

  it('agrees with createTheme on a junk stored value', () => {
    expect(run(themeScript(), 'chartreuse', true)).toHaveBeenCalledWith('data-theme', 'dark');
  });

  it('honours custom options', () => {
    const source = themeScript({ attribute: 'data-mode', defaultPreference: 'dark' });
    expect(run(source, null, false)).toHaveBeenCalledWith('data-mode', 'dark');
  });

  it('still applies the fallback when storage throws', () => {
    expect(run(themeScript(), new Error('blocked'), true)).toHaveBeenCalledWith(
      'data-theme',
      'dark'
    );
  });

  it('contains no `<`, so it needs no escaping inside a script element', () => {
    expect(themeScript()).not.toContain('<');
    expect(themeScript({ tag: true })).toMatch(/^<script>.*<\/script>$/s);
  });
  it('emits the scheme-only script unchanged when presets are off', () => {
    expect(themeScript({ presets: [] })).toBe(themeScript());
    expect(themeScript()).not.toContain('data-preset');
  });

  /** Runs the source against keyed storage, recording every attribute written. */
  function runWith(source: string, storage: Record<string, string>) {
    const set = vi.fn();
    new Function('localStorage', 'matchMedia', 'document', `${source};`)(
      { getItem: (key: string) => storage[key] ?? null },
      () => ({ matches: false }),
      { documentElement: { setAttribute: set } }
    );
    return set;
  }

  it('writes the stored preset beside the scheme', () => {
    const source = themeScript({ presets: ['loidolt', 'soft'] });
    const set = runWith(source, { 'loidolt-theme': 'dark', 'loidolt-preset': 'soft' });
    expect(set).toHaveBeenCalledWith('data-theme', 'dark');
    expect(set).toHaveBeenCalledWith('data-preset', 'soft');
  });

  it('agrees with createTheme on an unknown stored preset', () => {
    const source = themeScript({ presets: ['loidolt', 'soft'], defaultPreset: 'soft' });
    expect(runWith(source, { 'loidolt-preset': 'brutalist' })).toHaveBeenCalledWith(
      'data-preset',
      'soft'
    );
  });

  it('escapes preset names like every other caller string', () => {
    const source = themeScript({ presets: ['</script>'] });
    expect(source).not.toContain('<');
  });

  it('escapes caller strings that could end an inline script', () => {
    const source = themeScript({ storageKey: '</script><script>globalThis.pwned=1</script>' });
    expect(source).not.toContain('<');
    expect(source).toContain('\\u003c/script\\u003e');
  });
});

describe('createMediaQuery', () => {
  it('reports and tracks matches', () => {
    const media = fakeMatchMedia({ '(max-width: 760px)': true });
    media.install();

    const compact = createMediaQuery('(max-width: 760px)');
    expect(compact.matches).toBe(true);

    media.set('(max-width: 760px)', false);
    expect(compact.matches).toBe(false);

    compact.destroy();
    media.set('(max-width: 760px)', true);
    expect(compact.matches).toBe(false);
  });

  it('falls back where matchMedia is missing', () => {
    // @ts-expect-error deliberately removing the API to model an environment without it
    window.matchMedia = undefined;

    expect(createMediaQuery('(max-width: 760px)').matches).toBe(false);
    expect(createMediaQuery('(max-width: 760px)', { fallback: true }).matches).toBe(true);
  });

  it('builds breakpoint queries from tokens', () => {
    expect(breakpointQuery('compact')).toBe('(max-width: 760px)');
    // Fractional step: a whole pixel would leave 760.5px matching neither side.
    expect(breakpointQuery('compact', 'above')).toBe('(min-width: 760.02px)');
  });
});
