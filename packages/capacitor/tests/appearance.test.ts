import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import { describe, expect, it, vi } from 'vitest';
import { syncNativeAppearance, systemBarStyleFor } from '../src/lib/index.js';
import { fakeKeyboard, flush, platform, systemBars } from './fakes.js';

const styles = () => systemBars.setStyle.mock.calls.map(([options]) => options);

function fakeStatusBar() {
  return {
    setStyle: vi.fn(async (_options: { style: string }) => {}),
    setBackgroundColor: vi.fn(async (_options: { color: string }) => {}),
  };
}

describe('systemBarStyleFor', () => {
  it('picks dark icons on a light colour and light icons on a dark one', () => {
    expect(systemBarStyleFor('#ffffff')).toBe('LIGHT');
    expect(systemBarStyleFor(semantic.surface)).toBe('LIGHT');
    expect(systemBarStyleFor('#000000')).toBe('DARK');
    expect(systemBarStyleFor(darkSemantic.surface)).toBe('DARK');
  });

  it('ignores an alpha suffix', () => {
    expect(systemBarStyleFor('#00000080')).toBe('DARK');
  });
});

describe('syncNativeAppearance', () => {
  it('does nothing in a browser', () => {
    syncNativeAppearance()();
    expect(systemBars.setStyle).not.toHaveBeenCalled();
  });

  it('styles both bars for the theme on the page', () => {
    platform.current = 'ios';
    const stop = syncNativeAppearance();
    expect(styles()).toEqual([
      { style: 'LIGHT', bar: 'StatusBar' },
      { style: 'LIGHT', bar: 'NavigationBar' },
    ]);
    stop();
  });

  it('follows a theme change, sending only what changed', async () => {
    platform.current = 'ios';
    const stop = syncNativeAppearance();
    systemBars.setStyle.mockClear();
    document.documentElement.dataset.theme = 'dark';
    await flush();
    expect(styles()).toEqual([
      { style: 'DARK', bar: 'StatusBar' },
      { style: 'DARK', bar: 'NavigationBar' },
    ]);
    systemBars.setStyle.mockClear();
    document.documentElement.className = 'unrelated';
    await flush();
    expect(systemBars.setStyle).not.toHaveBeenCalled();
    stop();
    document.documentElement.className = '';
  });

  it('reads the roles it is told to, per bar', () => {
    platform.current = 'ios';
    const stop = syncNativeAppearance({ statusBarRole: 'surfaceInverse' });
    expect(styles()).toContainEqual({ style: 'DARK', bar: 'StatusBar' });
    expect(styles()).toContainEqual({ style: 'LIGHT', bar: 'NavigationBar' });
    stop();
  });

  it('paints the legacy Android status bar and matches the keyboard', async () => {
    platform.current = 'android';
    const StatusBar = fakeStatusBar();
    const Keyboard = fakeKeyboard();
    const stop = syncNativeAppearance({ StatusBar, Keyboard });
    expect(StatusBar.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
    expect(StatusBar.setBackgroundColor).toHaveBeenCalledWith({ color: semantic.surface });
    expect(Keyboard.setStyle).toHaveBeenCalledWith({ style: 'LIGHT' });
    document.documentElement.dataset.theme = 'dark';
    await flush();
    expect(StatusBar.setBackgroundColor).toHaveBeenLastCalledWith({ color: darkSemantic.surface });
    expect(Keyboard.setStyle).toHaveBeenLastCalledWith({ style: 'DARK' });
    stop();
  });

  it('leaves the status bar colour alone on iOS, which has none to paint', () => {
    platform.current = 'ios';
    const StatusBar = fakeStatusBar();
    const stop = syncNativeAppearance({ StatusBar });
    expect(StatusBar.setStyle).toHaveBeenCalled();
    expect(StatusBar.setBackgroundColor).not.toHaveBeenCalled();
    stop();
  });

  it('reads a scoped theme from the element it is given', () => {
    platform.current = 'ios';
    const scoped = document.createElement('div');
    scoped.dataset.theme = 'dark';
    document.body.append(scoped);
    const stop = syncNativeAppearance({ element: () => scoped });
    expect(styles()).toContainEqual({ style: 'DARK', bar: 'StatusBar' });
    stop();
  });

  it('stops listening once torn down', async () => {
    platform.current = 'ios';
    syncNativeAppearance()();
    systemBars.setStyle.mockClear();
    document.documentElement.dataset.theme = 'dark';
    await flush();
    expect(systemBars.setStyle).not.toHaveBeenCalled();
  });
});
