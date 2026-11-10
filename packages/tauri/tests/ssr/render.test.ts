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
    const notification = {
      isPermissionGranted: vi.fn(async () => true),
      requestPermission: vi.fn(async () => 'granted' as const),
      sendNotification: vi.fn(),
    };
    const event = { listen: vi.fn(async () => () => {}) };
    const deepLink = {
      getCurrent: vi.fn(async () => ['myapp://a']),
      onOpenUrl: vi.fn(async () => () => {}),
    };
    const tray = { TrayIcon: { new: vi.fn() } };
    const menu = { Menu: { new: vi.fn() } };
    const desktop = lib.setupTauri({
      plugins: { os, notification, event, deepLink, tray, menu },
      singleInstance: { onSecondInstance: () => {} },
      deepLinks: { navigate: () => {} },
      tray: { tooltip: 'Running', items: [{ id: 'quit', label: 'Quit' }] },
    });
    await desktop.ready;
    expect(desktop.platform).toBeNull();
    expect(os.type).not.toHaveBeenCalled();
    expect(desktop.notifications?.permission).toBe('unsupported');
    expect(await desktop.notifications?.requestPermission()).toBe('unsupported');
    expect(await desktop.notifications?.notify({ title: 'Export finished' })).toBe(false);
    expect(notification.isPermissionGranted).not.toHaveBeenCalled();
    expect(notification.sendNotification).not.toHaveBeenCalled();
    expect(event.listen).not.toHaveBeenCalled();
    expect(deepLink.getCurrent).not.toHaveBeenCalled();
    expect(tray.TrayIcon.new).not.toHaveBeenCalled();
    expect(menu.Menu.new).not.toHaveBeenCalled();
    await desktop.tray?.update({ tooltip: 'Idle' });
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

describe('the file adapters on the server', () => {
  it('pick nothing, save nowhere and never listen for drops', async () => {
    const dialog = { open: vi.fn(async () => '/a.txt'), save: vi.fn(async () => '/a.txt') };
    const fs = { readFile: vi.fn(async () => new Uint8Array()), writeFile: vi.fn(async () => {}) };
    const webview = vi.fn(() => ({ onDragDropEvent: vi.fn(async () => () => {}) }));
    const desktop = lib.setupTauri({ plugins: { dialog, fs, webview }, fileDrop: {} });
    expect(await desktop.files?.pick()).toEqual([]);
    expect(await desktop.files?.pickPaths()).toEqual([]);
    expect(await desktop.files?.save(new Blob([]) as File)).toEqual({ method: 'none' });
    expect(desktop.fileDrop?.dragging).toBe(false);
    desktop.destroy();
    for (const call of [dialog.open, dialog.save, fs.readFile, fs.writeFile, webview]) {
      expect(call).not.toHaveBeenCalled();
    }
    expect(lib.acceptToFilters('.pdf')).toEqual([{ name: 'PDF', extensions: ['pdf'] }]);
  });
});
