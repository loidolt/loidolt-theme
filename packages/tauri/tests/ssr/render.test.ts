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
    const event = { listen: vi.fn(async () => () => {}) };
    const deepLink = {
      getCurrent: vi.fn(async () => ['myapp://a']),
      onOpenUrl: vi.fn(async () => () => {}),
    };
    const tray = { TrayIcon: { new: vi.fn() } };
    const menu = { Menu: { new: vi.fn() } };
    const desktop = lib.setupTauri({
      plugins: { os, event, deepLink, tray, menu },
      singleInstance: { onSecondInstance: () => {} },
      deepLinks: { navigate: () => {} },
      tray: { tooltip: 'Running', items: [{ id: 'quit', label: 'Quit' }] },
    });
    await desktop.ready;
    expect(desktop.platform).toBeNull();
    expect(os.type).not.toHaveBeenCalled();
    expect(event.listen).not.toHaveBeenCalled();
    expect(deepLink.getCurrent).not.toHaveBeenCalled();
    expect(tray.TrayIcon.new).not.toHaveBeenCalled();
    expect(menu.Menu.new).not.toHaveBeenCalled();
    await desktop.tray?.update({ tooltip: 'Idle' });
    expect(lib.markTauriPlatform()).toBeTypeOf('function');
    desktop.destroy();
  });
});
