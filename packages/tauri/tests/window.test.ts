import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createTheme } from '@loidolt/theme-svelte';
import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import { flushSync } from 'svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  insetWindowChrome,
  showWindow,
  syncWindowAppearance,
  windowBackground,
} from '../src/lib/index.js';
import { enterTauri, fakeOs, fakeWindow, flush } from './fakes.js';

const root = document.documentElement;

afterEach(() => {
  delete root.dataset.theme;
  delete root.dataset.preset;
  root.removeAttribute('style');
  delete root.dataset.tauriTrafficLights;
});

describe('windowBackground', () => {
  it('is the theme background for the launch scheme', () => {
    expect(windowBackground()).toBe(semantic.background);
    expect(windowBackground('light')).toBe(semantic.background);
    expect(windowBackground('dark')).toBe(darkSemantic.background);
  });

  it('is what the example app launches in', () => {
    const config = JSON.parse(
      readFileSync(
        path.join(process.cwd(), '..', '..', 'examples', 'tauri', 'src-tauri', 'tauri.conf.json'),
        'utf8'
      )
    );
    expect(config.app.windows[0]).toMatchObject({
      visible: false,
      backgroundColor: windowBackground('light'),
    });
  });
});

describe('syncWindowAppearance', () => {
  it('does nothing in a browser', async () => {
    const win = fakeWindow();
    const appearance = syncWindowAppearance({ window: win });
    await appearance.ready;
    appearance.destroy();
    expect(win.setBackgroundColor).not.toHaveBeenCalled();
  });

  it('does nothing on a mobile target', () => {
    enterTauri('iphone');
    const win = fakeWindow();
    syncWindowAppearance({ window: win }).destroy();
    expect(win.setBackgroundColor).not.toHaveBeenCalled();
  });

  it('paints the window the page background and leaves its appearance to the OS', async () => {
    enterTauri('windows');
    const win = fakeWindow();
    const appearance = syncWindowAppearance({ window: win });
    await appearance.ready;
    expect(win.setBackgroundColor).toHaveBeenCalledExactlyOnceWith(semantic.background);
    expect(win.setTheme).not.toHaveBeenCalled();
    appearance.destroy();
  });

  it('follows a theme change, sending only what changed', async () => {
    enterTauri('linux');
    const win = fakeWindow();
    const appearance = syncWindowAppearance({ window: win });
    root.dataset.theme = 'dark';
    await flush();
    expect(win.setBackgroundColor).toHaveBeenLastCalledWith(darkSemantic.background);
    win.setBackgroundColor.mockClear();
    root.className = 'unrelated';
    await flush();
    expect(win.setBackgroundColor).not.toHaveBeenCalled();
    root.className = '';
    appearance.destroy();
    root.dataset.theme = 'light';
    await flush();
    expect(win.setBackgroundColor).not.toHaveBeenCalled();
  });

  it('reads the live colour, so a preset recolours the window', async () => {
    enterTauri('mac');
    // jsdom cannot resolve custom properties; stand in for the preset stylesheet.
    const computed = window.getComputedStyle.bind(window);
    vi.spyOn(window, 'getComputedStyle').mockImplementation((element) => {
      const style = computed(element);
      if (element.tagName !== 'SPAN') return style;
      const color = root.dataset.preset === 'soft' ? 'rgb(1, 2, 3)' : 'rgba(250, 250, 250, 0.5)';
      return { ...style, color } as CSSStyleDeclaration;
    });
    const win = fakeWindow();
    const appearance = syncWindowAppearance({ window: win, backgroundRole: 'surface' });
    expect(win.setBackgroundColor).toHaveBeenLastCalledWith('#fafafa');
    root.dataset.preset = 'soft';
    await flush();
    expect(win.setBackgroundColor).toHaveBeenLastCalledWith('#010203');
    appearance.destroy();
  });

  it('gives the window the theme’s explicit choice, and the OS’s for system', async () => {
    enterTauri('mac');
    const theme = createTheme({ storageKey: null, defaultPreference: 'system' });
    const win = fakeWindow();
    const appearance = syncWindowAppearance({ window: win, theme });
    await appearance.ready;
    expect(win.setTheme).toHaveBeenCalledExactlyOnceWith(null);

    theme.preference = 'dark';
    flushSync();
    await flush();
    expect(win.setTheme).toHaveBeenLastCalledWith('dark');
    expect(win.setBackgroundColor).toHaveBeenLastCalledWith(darkSemantic.background);

    // Back to a system that is light: the attribute changes, and so does the window.
    theme.preference = 'system';
    flushSync();
    await flush();
    expect(win.setTheme).toHaveBeenLastCalledWith(null);

    theme.preference = 'light';
    flushSync();
    await flush();
    expect(win.setTheme).toHaveBeenLastCalledWith('light');
    win.setTheme.mockClear();
    // Back to system while the system is light: no attribute moves, the preference still counts.
    theme.preference = 'system';
    flushSync();
    expect(win.setTheme).toHaveBeenCalledExactlyOnceWith(null);

    appearance.destroy();
    win.setTheme.mockClear();
    theme.preference = 'dark';
    flushSync();
    await flush();
    expect(win.setTheme).not.toHaveBeenCalled();
    theme.destroy();
  });

  it('reads another element when told to', () => {
    enterTauri('mac');
    const scoped = document.createElement('div');
    scoped.dataset.theme = 'dark';
    document.body.append(scoped);
    const win = fakeWindow();
    syncWindowAppearance({ window: win, element: () => scoped }).destroy();
    expect(win.setBackgroundColor).toHaveBeenCalledWith(darkSemantic.background);
  });

  it('survives a window that refuses, and is still ready', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    win.setBackgroundColor.mockRejectedValue(new Error('not allowed by the capability'));
    win.setTheme.mockRejectedValue(new Error('not allowed by the capability'));
    const theme = createTheme({ storageKey: null, defaultPreference: 'dark' });
    const appearance = syncWindowAppearance({ window: win, theme });
    await expect(appearance.ready).resolves.toBeUndefined();
    appearance.destroy();
    theme.destroy();
  });

  it('falls back to <html> when the element is not there', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const appearance = syncWindowAppearance({ window: win, element: () => null });
    await appearance.ready;
    expect(win.setBackgroundColor).toHaveBeenCalledOnce();
    appearance.destroy();
  });
});

describe('insetWindowChrome', () => {
  const insetTop = () => root.style.getPropertyValue('--ldt-safe-top');

  it('does nothing in a browser, on Windows and Linux, or with a native title bar', () => {
    const win = fakeWindow();
    insetWindowChrome({ window: win, titleBar: 'overlay' })();
    enterTauri('windows');
    insetWindowChrome({ window: win, titleBar: 'overlay' })();
    insetWindowChrome({ window: win, titleBar: 'overlay' }, fakeOs('linux'))();
    enterTauri('mac');
    insetWindowChrome({ window: win })();
    insetWindowChrome({ window: win, titleBar: 'native' })();
    expect(win.onResized).not.toHaveBeenCalled();
    expect(insetTop()).toBe('');
  });

  it('reserves the title bar strip on macOS, from the first frame', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const stop = insetWindowChrome({ window: win, titleBar: 'overlay' });
    expect(insetTop()).toBe('28px');
    expect(root).toHaveAttribute('data-tauri-traffic-lights', 'above');
    await flush();
    expect(insetTop()).toBe('28px');
    stop();
    stop();
    expect(insetTop()).toBe('');
    expect(root).not.toHaveAttribute('data-tauri-traffic-lights');
    expect(win.unlisten).toHaveBeenCalledOnce();
  });

  it('gives the room back in full screen, and takes it again on the way out', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const stop = insetWindowChrome({ window: win, titleBar: 'overlay', top: '32px' });
    await flush();
    expect(insetTop()).toBe('32px');
    win.resize({ fullscreen: true });
    await flush();
    expect(insetTop()).toBe('');
    expect(root).not.toHaveAttribute('data-tauri-traffic-lights');
    win.resize({ fullscreen: false });
    await flush();
    expect(insetTop()).toBe('32px');
    stop();
  });

  it('starts out of the way in a window that launches full screen', async () => {
    enterTauri('mac');
    const win = fakeWindow({ fullscreen: true });
    const stop = insetWindowChrome({ window: win, titleBar: 'overlay' });
    await flush();
    expect(insetTop()).toBe('');
    stop();
  });

  it('insets the topbar row instead when the buttons sit beside it', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const stop = insetWindowChrome({ window: win, titleBar: 'overlay', trafficLights: 'beside' });
    expect(root).toHaveAttribute('data-tauri-traffic-lights', 'beside');
    expect(root.style.getPropertyValue('--ldt-tauri-traffic-lights')).toBe('78px');
    expect(insetTop()).toBe('');
    stop();
    expect(root.style.getPropertyValue('--ldt-tauri-traffic-lights')).toBe('');
  });

  it('puts back an inset the app set itself', () => {
    enterTauri('mac');
    root.style.setProperty('--ldt-safe-top', '40px');
    const stop = insetWindowChrome({ window: fakeWindow(), titleBar: 'overlay' });
    expect(insetTop()).toBe('28px');
    stop();
    expect(insetTop()).toBe('40px');
  });

  it('ignores a full-screen answer that arrives after the teardown', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const stop = insetWindowChrome({ window: win, titleBar: 'overlay' });
    stop();
    await flush();
    expect(insetTop()).toBe('');
    expect(win.unlisten).toHaveBeenCalledOnce();
  });
});

describe('showWindow', () => {
  it('does nothing in a browser', async () => {
    const win = fakeWindow();
    await showWindow({ window: win });
    expect(win.show).not.toHaveBeenCalled();
  });

  it('waits for the theme and the fonts, then shows the window', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    let resolve!: () => void;
    const until = new Promise<void>((done) => (resolve = done));
    const shown = showWindow({ window: win, until });
    await flush();
    expect(win.show).not.toHaveBeenCalled();
    resolve();
    await shown;
    expect(win.show).toHaveBeenCalledOnce();
  });

  it('waits for the fonts when the document has them', async () => {
    enterTauri('mac');
    let loaded!: () => void;
    const ready = new Promise<void>((done) => (loaded = done));
    Object.defineProperty(document, 'fonts', { configurable: true, value: { ready } });
    try {
      const win = fakeWindow();
      const shown = showWindow({ window: win });
      await flush();
      expect(win.show).not.toHaveBeenCalled();
      loaded();
      await shown;
      expect(win.show).toHaveBeenCalledOnce();
    } finally {
      delete (document as { fonts?: unknown }).fonts;
    }
  });

  it('shows anyway after the timeout, and survives a refusal', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    win.show.mockRejectedValue(new Error('not allowed by the capability'));
    await showWindow({
      window: win,
      until: new Promise(() => {}),
      waitForFonts: false,
      timeout: 5,
    });
    expect(win.show).toHaveBeenCalledOnce();
  });

  it('shows even when what it waits for fails', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    await showWindow({ window: win, until: Promise.reject(new Error('no data')) });
    expect(win.show).toHaveBeenCalledOnce();
  });
});
