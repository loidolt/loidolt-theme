import { createTheme, createToaster } from '@loidolt/theme-svelte';
import { describe, expect, it, vi } from 'vitest';
import * as lib from '../../src/lib/index.js';
import { themeConfig } from '../../src/lib/config/index.js';

/**
 * The server bundle of an app imports the same root layout the device runs, so every adapter
 * has to load and run without a DOM — and do nothing.
 */
describe('on the server', () => {
  it('reports no native platform', () => {
    expect(lib.nativePlatform()).toBeNull();
    expect(lib.isNativePlatform()).toBe(false);
  });

  it('sets up as a no-op with every plugin given', async () => {
    const listener = vi.fn(async () => ({ remove: async () => {} }));
    const native = lib.setupCapacitor({
      plugins: {
        App: {
          addListener: listener,
          exitApp: vi.fn(),
          minimizeApp: vi.fn(),
        } as unknown as lib.CapacitorPlugins['App'],
        Haptics: {} as lib.HapticsPlugin,
        Keyboard: { addListener: listener } as unknown as lib.CapacitorPlugins['Keyboard'],
        Network: { addListener: listener } as unknown as lib.NetworkPlugin,
      },
      theme: createTheme(),
      toaster: createToaster(),
    });
    await native.ready;
    expect(listener).not.toHaveBeenCalled();
    expect(native.keyboard?.visible).toBe(false);
    expect(native.network?.connected).toBe(true);
    expect(native.lifecycle?.active).toBe(true);
    native.destroy();
  });

  it('shares nothing', async () => {
    const share = vi.fn();
    const sharing = lib.createShare({ Share: { share, canShare: vi.fn() } });
    expect(await sharing.share({ url: 'https://example.com/' })).toEqual({
      method: 'none',
      cancelled: false,
    });
    expect(await sharing.canShare()).toBe(false);
    expect(share).not.toHaveBeenCalled();
  });

  it('builds the Capacitor config', () => {
    expect(themeConfig().plugins.SystemBars.insetsHandling).toBe('css');
  });
});
