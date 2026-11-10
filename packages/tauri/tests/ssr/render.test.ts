import { describe, expect, it, vi } from 'vitest';
import * as lib from '../../src/lib/index.js';

/**
 * The server bundle of an app imports the same root layout the window runs, so every adapter
 * has to load and run without a DOM — and do nothing.
 */
describe('on the server', () => {
  it('reports no Tauri window, even with the globals present', () => {
    (globalThis as Record<string, unknown>).isTauri = true;
    try {
      expect(lib.isTauri()).toBe(false);
      expect(lib.tauriPlatform()).toBeNull();
    } finally {
      delete (globalThis as Record<string, unknown>).isTauri;
    }
  });

  it('sets up as a no-op with every plugin given', async () => {
    const os = { type: vi.fn(() => 'macos' as const) };
    const desktop = lib.setupTauri({ plugins: { os } });
    await desktop.ready;
    expect(desktop.platform).toBeNull();
    expect(os.type).not.toHaveBeenCalled();
    expect(lib.markTauriPlatform()).toBeTypeOf('function');
    desktop.destroy();
  });
});

describe('the window adapters on the server', () => {
  it('do nothing with a window given', async () => {
    const win = {
      setBackgroundColor: vi.fn(async () => {}),
      setTheme: vi.fn(async () => {}),
      isFullscreen: vi.fn(async () => false),
      onResized: vi.fn(async () => () => {}),
      show: vi.fn(async () => {}),
    };
    const desktop = lib.setupTauri({ plugins: { window: win }, chrome: { titleBar: 'overlay' } });
    await desktop.ready;
    desktop.destroy();
    const appearance = lib.syncWindowAppearance({ window: win });
    await appearance.ready;
    appearance.destroy();
    lib.insetWindowChrome({ window: win, titleBar: 'overlay' })();
    await lib.showWindow({ window: win });
    for (const call of Object.values(win)) expect(call).not.toHaveBeenCalled();
    expect(lib.windowBackground('dark')).toMatch(/^#[0-9a-f]{6}$/);
  });
});
