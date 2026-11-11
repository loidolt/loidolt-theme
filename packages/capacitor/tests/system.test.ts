import { afterEach, describe, expect, it, vi } from 'vitest';
import { bridgeClipboard, followSystemTextSize, hideSplashScreen } from '../src/lib/index.js';
import { fakeApp, flush, platform } from './fakes.js';

const fakeSplash = () => ({ hide: vi.fn(async (_options?: { fadeOutDuration?: number }) => {}) });

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('hideSplashScreen', () => {
  it('does nothing in a browser', async () => {
    const SplashScreen = fakeSplash();
    await hideSplashScreen({ SplashScreen });
    expect(SplashScreen.hide).not.toHaveBeenCalled();
  });

  it('waits for what it is given, then fades the splash out', async () => {
    platform.current = 'ios';
    const SplashScreen = fakeSplash();
    let release!: () => void;
    const until = new Promise<void>((resolve) => (release = resolve));
    const hidden = hideSplashScreen({ SplashScreen, until, waitForFonts: false });
    await flush();
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    release();
    await hidden;
    expect(SplashScreen.hide).toHaveBeenCalledWith({ fadeOutDuration: 200 });
  });

  it('lifts anyway at the timeout, and when the wait fails', async () => {
    platform.current = 'android';
    const SplashScreen = fakeSplash();
    await hideSplashScreen({ SplashScreen, until: new Promise(() => {}), timeout: 10 });
    expect(SplashScreen.hide).toHaveBeenCalledOnce();
    await hideSplashScreen({ SplashScreen, until: Promise.reject(new Error('offline')) });
    expect(SplashScreen.hide).toHaveBeenCalledTimes(2);
  });

  it('waits for the fonts', async () => {
    platform.current = 'ios';
    const SplashScreen = fakeSplash();
    let loaded!: () => void;
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      value: { ready: new Promise<void>((resolve) => (loaded = resolve)) },
    });
    const hidden = hideSplashScreen({ SplashScreen });
    await flush();
    expect(SplashScreen.hide).not.toHaveBeenCalled();
    loaded();
    await hidden;
    expect(SplashScreen.hide).toHaveBeenCalledOnce();
    delete (document as { fonts?: unknown }).fonts;
  });

  it('cuts the fade for reduced motion, and never rejects', async () => {
    platform.current = 'ios';
    vi.stubGlobal(
      'matchMedia',
      vi.fn((query: string) => ({ matches: query.includes('reduce') }))
    );
    const SplashScreen = fakeSplash();
    SplashScreen.hide.mockRejectedValue(new Error('already hidden'));
    await expect(
      hideSplashScreen({ SplashScreen, waitForFonts: false, fadeOutDuration: 500 })
    ).resolves.toBeUndefined();
    expect(SplashScreen.hide).toHaveBeenCalledWith({ fadeOutDuration: 0 });
  });
});

describe('followSystemTextSize', () => {
  const fakeZoom = (value: number) => ({
    getPreferred: vi.fn(async () => ({ value })),
    set: vi.fn(async (_options: { value: number }) => {}),
  });

  it('does nothing in a browser', async () => {
    const TextZoom = fakeZoom(1.3);
    followSystemTextSize({ TextZoom })();
    await flush();
    expect(TextZoom.getPreferred).not.toHaveBeenCalled();
  });

  it('applies the system size, and re-reads it on resume', async () => {
    platform.current = 'ios';
    const TextZoom = fakeZoom(1.3);
    const App = fakeApp();
    const stop = followSystemTextSize({ TextZoom, App });
    await flush();
    expect(TextZoom.set).toHaveBeenCalledWith({ value: 1.3 });
    App.emit('resume');
    await flush();
    // Unchanged, so not re-sent.
    expect(TextZoom.set).toHaveBeenCalledOnce();
    TextZoom.getPreferred.mockResolvedValue({ value: 1.6 });
    App.emit('resume');
    await flush();
    expect(TextZoom.set).toHaveBeenLastCalledWith({ value: 1.6 });
    stop();
  });

  it('publishes the iOS zoom as --ldt-text-zoom, and removes it on teardown', async () => {
    platform.current = 'ios';
    const TextZoom = fakeZoom(1.94);
    const stop = followSystemTextSize({ TextZoom });
    await flush();
    expect(document.documentElement.style.getPropertyValue('--ldt-text-zoom')).toBe('1.94');
    stop();
    expect(document.documentElement.style.getPropertyValue('--ldt-text-zoom')).toBe('');
  });

  it('writes no variable on Android, whose web view zooms text its own way', async () => {
    platform.current = 'android';
    const TextZoom = fakeZoom(1.5);
    const stop = followSystemTextSize({ TextZoom });
    await flush();
    expect(TextZoom.set).toHaveBeenCalledWith({ value: 1.5 });
    expect(document.documentElement.style.getPropertyValue('--ldt-text-zoom')).toBe('');
    stop();
  });

  it('ignores a nonsense reading', async () => {
    platform.current = 'android';
    const TextZoom = fakeZoom(Number.NaN);
    followSystemTextSize({ TextZoom });
    await flush();
    expect(TextZoom.set).not.toHaveBeenCalled();
  });
});

describe('bridgeClipboard', () => {
  const fakeClipboard = () => ({ write: vi.fn(async (_options: { string?: string }) => {}) });

  it('leaves the web Clipboard API alone in a browser', () => {
    const Clipboard = fakeClipboard();
    bridgeClipboard({ Clipboard })();
    expect(Clipboard.write).not.toHaveBeenCalled();
  });

  it('routes writeText through the plugin, and restores it', async () => {
    platform.current = 'android';
    const original = vi.fn(async () => {});
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText: original },
    });
    const Clipboard = fakeClipboard();
    const stop = bridgeClipboard({ Clipboard });
    await navigator.clipboard.writeText('npm install');
    expect(Clipboard.write).toHaveBeenCalledWith({ string: 'npm install' });
    expect(original).not.toHaveBeenCalled();
    stop();
    expect(navigator.clipboard.writeText).toBe(original);
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  it('restores an inherited writeText by removing its own', async () => {
    platform.current = 'ios';
    const inherited = vi.fn(async () => {});
    const clipboard = Object.create({ writeText: inherited });
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: clipboard });
    const stop = bridgeClipboard({ Clipboard: fakeClipboard() });
    expect(navigator.clipboard.writeText).not.toBe(inherited);
    stop();
    expect(navigator.clipboard.writeText).toBe(inherited);
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  it('provides a Clipboard API where there is none', async () => {
    platform.current = 'ios';
    expect(navigator.clipboard).toBeUndefined();
    const Clipboard = fakeClipboard();
    const stop = bridgeClipboard({ Clipboard });
    await navigator.clipboard.writeText('copied');
    expect(Clipboard.write).toHaveBeenCalledWith({ string: 'copied' });
    stop();
    expect(navigator.clipboard).toBeUndefined();
  });
});
