import { createTheme } from '@loidolt/theme-svelte';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it } from 'vitest';
import { persistTheme } from '../src/lib/index.js';
import { fakePreferences, flush, platform } from './fakes.js';

afterEach(() => {
  localStorage.clear();
});

describe('persistTheme', () => {
  it('is a no-op in a browser', async () => {
    const Preferences = fakePreferences({ 'loidolt-theme': 'dark' });
    const theme = createTheme();
    const persisted = persistTheme(theme, { Preferences });
    await persisted.ready;
    expect(Preferences.get).not.toHaveBeenCalled();
    expect(theme.preference).toBe('system');
    persisted.destroy();
    theme.destroy();
  });

  it('restores the stored choice, then mirrors every change', async () => {
    platform.current = 'ios';
    const Preferences = fakePreferences({ 'loidolt-theme': 'dark' });
    const theme = createTheme();
    const persisted = persistTheme(theme, { Preferences });
    flushSync();
    // Nothing is written before the stored value is read, or the default would replace it.
    expect(Preferences.set).not.toHaveBeenCalled();
    await persisted.ready;
    expect(theme.preference).toBe('dark');
    expect(document.documentElement).toHaveAttribute('data-theme', 'dark');

    theme.preference = 'light';
    flushSync();
    expect(Preferences.store.get('loidolt-theme')).toBe('light');
    persisted.destroy();
    theme.preference = 'system';
    flushSync();
    expect(Preferences.store.get('loidolt-theme')).toBe('light');
    theme.destroy();
  });

  it('restores and mirrors the preset when the theme has presets', async () => {
    platform.current = 'android';
    const Preferences = fakePreferences({ 'loidolt-preset': 'soft' });
    const theme = createTheme({ presets: ['loidolt', 'soft'] });
    const persisted = persistTheme(theme, { Preferences });
    await persisted.ready;
    expect(theme.preset).toBe('soft');
    theme.preset = 'loidolt';
    flushSync();
    expect(Preferences.store.get('loidolt-preset')).toBe('loidolt');
    persisted.destroy();
    theme.destroy();
  });

  it('ignores stored values the theme does not know', async () => {
    platform.current = 'ios';
    const Preferences = fakePreferences({ scheme: 'sepia', look: 'neon' });
    const theme = createTheme({ presets: ['loidolt', 'soft'] });
    const persisted = persistTheme(theme, { Preferences, key: 'scheme', presetKey: 'look' });
    await persisted.ready;
    expect(theme.preference).toBe('system');
    expect(theme.preset).toBe('loidolt');
    flushSync();
    expect(Preferences.store.get('scheme')).toBe('system');
    persisted.destroy();
    theme.destroy();
  });

  it('survives a failing plugin and a teardown before the read lands', async () => {
    platform.current = 'ios';
    const failing = fakePreferences();
    failing.get.mockRejectedValue(new Error('no native plugin'));
    const theme = createTheme();
    const persisted = persistTheme(theme, { Preferences: failing });
    await expect(persisted.ready).resolves.toBeUndefined();
    persisted.destroy();

    const Preferences = fakePreferences({ 'loidolt-theme': 'dark' });
    const early = persistTheme(theme, { Preferences });
    early.destroy();
    await early.ready;
    await flush();
    expect(theme.preference).toBe('system');
    theme.destroy();
  });
});
