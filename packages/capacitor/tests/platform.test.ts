import { describe, expect, it, vi } from 'vitest';
import { combine, listen, quietly } from '../src/lib/platform.js';
import { isNativePlatform, markNativePlatform, nativePlatform } from '../src/lib/index.js';
import { flush, platform } from './fakes.js';

describe('platform', () => {
  it('is null in a browser and names the shell inside one', () => {
    expect(nativePlatform()).toBeNull();
    expect(isNativePlatform()).toBe(false);
    platform.current = 'ios';
    expect(nativePlatform()).toBe('ios');
    platform.current = 'android';
    expect(isNativePlatform()).toBe(true);
  });

  it('marks <html> with the platform, and unmarks it', () => {
    expect(markNativePlatform()).toBeTypeOf('function');
    expect(document.documentElement).not.toHaveAttribute('data-native-platform');
    platform.current = 'android';
    const unmark = markNativePlatform();
    expect(document.documentElement).toHaveAttribute('data-native-platform', 'android');
    unmark();
    expect(document.documentElement).not.toHaveAttribute('data-native-platform');
  });
});

describe('listen', () => {
  it('removes a listener whose handle arrives after the teardown', async () => {
    const remove = vi.fn(async () => {});
    const stop = listen(Promise.resolve({ remove }));
    stop();
    expect(remove).not.toHaveBeenCalled();
    await flush();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('removes a resolved listener once, however often it is stopped', async () => {
    const remove = vi.fn(async () => {});
    const stop = listen(Promise.resolve({ remove }));
    await flush();
    stop();
    stop();
    expect(remove).toHaveBeenCalledOnce();
  });

  it('survives a plugin whose addListener rejects', async () => {
    const stop = listen(Promise.reject(new Error('not implemented')));
    await flush();
    expect(stop).not.toThrow();
  });
});

describe('helpers', () => {
  it('swallows rejections and ignores plain values', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    quietly(Promise.reject(new Error('no native plugin')));
    quietly(undefined);
    await flush();
    process.off('unhandledRejection', unhandled);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('combines teardowns into one that runs each once', () => {
    const a = vi.fn();
    const b = vi.fn();
    const stop = combine(a, undefined, b);
    stop();
    stop();
    expect(a).toHaveBeenCalledOnce();
    expect(b).toHaveBeenCalledOnce();
  });
});
