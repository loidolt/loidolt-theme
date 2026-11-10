import { render } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import { setupTauri } from '../src/lib/index.js';
import Harness from './Harness.svelte';
import { enterTauri, fakeOs } from './fakes.js';

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
