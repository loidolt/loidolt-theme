import { describe, expect, it, vi } from 'vitest';
import { combine, listen, quietly } from '../src/lib/platform.js';
import { isTauri, markTauriPlatform, tauriPlatform } from '../src/lib/index.js';
import { enterTauri, fakeOs, flush } from './fakes.js';

describe('isTauri', () => {
  it('is false in a plain browser', () => {
    expect(isTauri()).toBe(false);
    expect(tauriPlatform()).toBeNull();
  });

  it('is true with the IPC bridge alone, the isTauri flag alone, or both', () => {
    for (const globals of ['internals', 'flag', 'both'] as const) {
      enterTauri('mac', globals);
      expect(isTauri(), globals).toBe(true);
    }
  });
});

describe('tauriPlatform', () => {
  it('reads the OS from the user agent', () => {
    const cases = [
      ['mac', 'macos'],
      ['ipad', 'ios'],
      ['iphone', 'ios'],
      ['windows', 'windows'],
      ['linux', 'linux'],
      ['android', 'android'],
    ] as const;
    for (const [agent, platform] of cases) {
      enterTauri(agent);
      expect(tauriPlatform(), agent).toBe(platform);
    }
  });

  it('prefers the os plugin, and falls back when it throws', () => {
    enterTauri('mac');
    const os = fakeOs('linux');
    expect(tauriPlatform(os)).toBe('linux');
    os.type.mockImplementation(() => {
      throw new Error('os plugin not registered');
    });
    expect(tauriPlatform(os)).toBe('macos');
  });

  it('ignores the os plugin outside Tauri', () => {
    const os = fakeOs('macos');
    expect(tauriPlatform(os)).toBeNull();
    expect(os.type).not.toHaveBeenCalled();
  });
});

describe('markTauriPlatform', () => {
  it('is a no-op in a browser', () => {
    expect(markTauriPlatform()).toBeTypeOf('function');
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
  });

  it('marks <html> with the platform, and unmarks it', () => {
    enterTauri('windows');
    const unmark = markTauriPlatform();
    expect(document.documentElement).toHaveAttribute('data-tauri-platform', 'windows');
    unmark();
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
  });

  it('marks another element, using the os plugin', () => {
    enterTauri('linux');
    const element = document.createElement('div');
    markTauriPlatform(element, fakeOs('macos'));
    expect(element).toHaveAttribute('data-tauri-platform', 'macos');
  });
});

describe('listen', () => {
  it('unlistens once the function arrives after the teardown', async () => {
    const unlisten = vi.fn();
    const stop = listen(Promise.resolve(unlisten));
    stop();
    expect(unlisten).not.toHaveBeenCalled();
    await flush();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('unlistens once, however often it is stopped', async () => {
    const unlisten = vi.fn();
    const stop = listen(unlisten);
    await flush();
    stop();
    stop();
    expect(unlisten).toHaveBeenCalledOnce();
  });

  it('survives a listen that rejects', async () => {
    const stop = listen(Promise.reject(new Error('not allowed by the capability')));
    await flush();
    expect(stop).not.toThrow();
  });
});

describe('helpers', () => {
  it('swallows rejections and ignores plain values', async () => {
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);
    quietly(Promise.reject(new Error('plugin missing')));
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
