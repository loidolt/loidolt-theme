import { createTheme } from '@loidolt/theme-svelte';
import { darkSemantic } from '@loidolt/theme-tokens';
import { render } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { setupTauri } from '../src/lib/index.js';
import Harness from './Harness.svelte';
import { enterTauri, fakeDialog, fakeFs, fakeOs, fakeWebview, fakeWindow, flush } from './fakes.js';

describe('setupTauri', () => {
  it('does nothing in a browser and is ready at once', async () => {
    const os = fakeOs();
    const desktop = setupTauri({ plugins: { os } });
    await desktop.ready;
    expect(desktop.platform).toBeNull();
    expect(os.type).not.toHaveBeenCalled();
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
    desktop.destroy();
  });

  it('needs no options at all', async () => {
    enterTauri('linux');
    const desktop = setupTauri();
    await desktop.ready;
    expect(desktop.platform).toBe('linux');
    desktop.destroy();
  });

  it('marks the platform inside a window, and unmarks it on destroy', () => {
    enterTauri('mac');
    const desktop = setupTauri({ plugins: { os: fakeOs('macos') } });
    expect(desktop.platform).toBe('macos');
    expect(document.documentElement).toHaveAttribute('data-tauri-platform', 'macos');
    desktop.destroy();
    desktop.destroy();
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
  });

  it('leaves <html> alone when told to', () => {
    enterTauri('mac');
    const desktop = setupTauri({ markPlatform: false });
    expect(desktop.platform).toBe('macos');
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
    desktop.destroy();
  });

  it('tears itself down with the component that called it', () => {
    enterTauri('windows');
    const { unmount } = render(Harness);
    expect(document.documentElement).toHaveAttribute('data-tauri-platform', 'windows');
    unmount();
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
  });
});

describe('setupTauri with the window', () => {
  it('leaves the window alone in a browser', async () => {
    const win = fakeWindow();
    const desktop = setupTauri({ plugins: { window: win }, chrome: { titleBar: 'overlay' } });
    await desktop.ready;
    expect(win.setBackgroundColor).not.toHaveBeenCalled();
    expect(win.onResized).not.toHaveBeenCalled();
    expect(win.show).not.toHaveBeenCalled();
    desktop.destroy();
  });

  it('paints, themes, insets and then shows the window, and undoes it all', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const theme = createTheme({ storageKey: null, defaultPreference: 'dark' });
    const desktop = setupTauri({
      plugins: { os: fakeOs('macos'), window: win },
      theme,
      chrome: { titleBar: 'overlay' },
      show: { waitForFonts: false },
    });
    expect(document.documentElement.style.getPropertyValue('--ldt-safe-top')).toBe('28px');
    await desktop.ready;
    expect(win.setBackgroundColor).toHaveBeenCalledWith(darkSemantic.background);
    expect(win.setTheme).toHaveBeenCalledWith('dark');
    expect(win.show).toHaveBeenCalledOnce();
    expect(win.show.mock.invocationCallOrder[0]).toBeGreaterThan(
      win.setTheme.mock.invocationCallOrder[0]
    );
    desktop.destroy();
    expect(document.documentElement.style.getPropertyValue('--ldt-safe-top')).toBe('');
    expect(document.documentElement).not.toHaveAttribute('data-tauri-platform');
    expect(win.unlisten).toHaveBeenCalledOnce();
    theme.destroy();
    delete document.documentElement.dataset.theme;
  });

  it('only asks for the window inside one, when given the getter', async () => {
    const getCurrentWindow = vi.fn(() => fakeWindow());
    setupTauri({ plugins: { window: getCurrentWindow } }).destroy();
    expect(getCurrentWindow).not.toHaveBeenCalled();
    enterTauri('linux');
    const win = fakeWindow();
    const desktop = setupTauri({ plugins: { window: () => win }, show: false });
    await desktop.ready;
    expect(win.setBackgroundColor).toHaveBeenCalledOnce();
    desktop.destroy();
  });

  it('turns each window adapter off on request', async () => {
    enterTauri('mac');
    const win = fakeWindow();
    const desktop = setupTauri({
      plugins: { window: win },
      appearance: false,
      chrome: false,
      show: false,
    });
    await desktop.ready;
    expect(win.setBackgroundColor).not.toHaveBeenCalled();
    expect(win.onResized).not.toHaveBeenCalled();
    expect(win.show).not.toHaveBeenCalled();
    desktop.destroy();
  });

  it('shows the window with no appearance to wait for', async () => {
    enterTauri('windows');
    const win = fakeWindow();
    const desktop = setupTauri({ plugins: { window: win }, appearance: false });
    await desktop.ready;
    expect(win.show).toHaveBeenCalledOnce();
    expect(win.onResized).not.toHaveBeenCalled();
    desktop.destroy();
  });
});

describe('setupTauri with files', () => {
  it('gives desktop.files through the dialog and fs plugins in a window', async () => {
    enterTauri('mac');
    const dialog = fakeDialog('/Users/sam/a.txt');
    const fs = fakeFs({ '/Users/sam/a.txt': 'a' });
    const desktop = setupTauri({ plugins: { dialog, fs } });
    const [file] = (await desktop.files?.pick({ accept: '.txt' })) ?? [];
    expect(file).toMatchObject({ name: 'a.txt', path: '/Users/sam/a.txt' });
    expect(desktop.fileDrop).toBeUndefined();
    desktop.destroy();
  });

  it('leaves desktop.files out when told to', () => {
    const desktop = setupTauri({ files: false });
    expect(desktop.files).toBeUndefined();
    desktop.destroy();
  });

  it('wires file drops through the web view and fs, and stops them on destroy', async () => {
    enterTauri('mac');
    const webview = fakeWebview();
    const fs = fakeFs({ '/a.txt': 'a' });
    const onFiles = vi.fn();
    const desktop = setupTauri({
      plugins: { webview: () => webview, fs },
      fileDrop: { onFiles },
    });
    webview.fire({ type: 'enter', paths: ['/a.txt'], position: { x: 0, y: 0 } });
    expect(desktop.fileDrop?.dragging).toBe(true);
    webview.fire({ type: 'drop', paths: ['/a.txt'], position: { x: 0, y: 0 } });
    await flush();
    expect(onFiles).toHaveBeenCalledWith([expect.objectContaining({ name: 'a.txt' })]);
    desktop.destroy();
    await flush();
    expect(webview.unlisten).toHaveBeenCalledOnce();
  });

  it('needs both the web view and fileDrop options for file drops', () => {
    enterTauri('mac');
    const webview = fakeWebview();
    expect(setupTauri({ plugins: { webview } }).fileDrop).toBeUndefined();
    expect(setupTauri({ fileDrop: {} }).fileDrop).toBeUndefined();
    expect(webview.onDragDropEvent).not.toHaveBeenCalled();
  });

  it('keeps file drops inert in a browser', () => {
    const webview = vi.fn(fakeWebview);
    const desktop = setupTauri({ plugins: { webview }, fileDrop: {} });
    expect(desktop.fileDrop?.dragging).toBe(false);
    expect(webview).not.toHaveBeenCalled();
    desktop.destroy();
  });
});
