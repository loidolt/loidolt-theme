import { createTheme, createToaster } from '@loidolt/theme-svelte';
import { describe, expect, it, vi } from 'vitest';
import { setupCapacitor } from '../src/lib/index.js';
import {
  fakeApp,
  fakeFilePicker,
  fakeFilesystem,
  fakeHaptics,
  fakeKeyboard,
  fakeNetwork,
  fakePreferences,
  flush,
  platform,
  systemBars,
} from './fakes.js';

function plugins() {
  return {
    App: fakeApp(),
    Browser: { open: vi.fn(async () => {}) },
    Clipboard: { write: vi.fn(async () => {}) },
    FilePicker: fakeFilePicker(),
    Filesystem: fakeFilesystem(),
    Haptics: fakeHaptics(),
    Keyboard: fakeKeyboard(),
    Network: fakeNetwork(),
    Preferences: fakePreferences({ 'loidolt-theme': 'dark' }),
    SplashScreen: { hide: vi.fn(async () => {}) },
    StatusBar: { setStyle: vi.fn(async () => {}), setBackgroundColor: vi.fn(async () => {}) },
    TextZoom: { getPreferred: vi.fn(async () => ({ value: 1 })), set: vi.fn(async () => {}) },
  };
}

describe('setupCapacitor', () => {
  it('installs nothing in a browser and is ready at once', async () => {
    const all = plugins();
    const native = setupCapacitor({ plugins: all, theme: createTheme() });
    await native.ready;
    expect(all.App.addListener).not.toHaveBeenCalled();
    expect(all.Preferences.get).not.toHaveBeenCalled();
    expect(all.SplashScreen.hide).not.toHaveBeenCalled();
    expect(native.keyboard?.visible).toBe(false);
    native.destroy();
  });

  it('turns on every adapter whose plugin is present', async () => {
    platform.current = 'android';
    const all = plugins();
    const theme = createTheme();
    const navigate = vi.fn();
    const native = setupCapacitor({
      plugins: all,
      theme,
      toaster: createToaster(),
      navigate,
      splash: { waitForFonts: false },
    });
    await native.ready;

    expect(document.documentElement).toHaveAttribute('data-native-platform', 'android');
    expect(systemBars.setStyle).toHaveBeenCalled();
    expect(all.StatusBar.setBackgroundColor).toHaveBeenCalled();
    expect(theme.preference).toBe('dark');
    expect(all.SplashScreen.hide).toHaveBeenCalledOnce();
    expect(all.TextZoom.getPreferred).toHaveBeenCalled();

    for (const event of ['backButton', 'appStateChange', 'appUrlOpen', 'resume']) {
      expect(all.App.count(event), event).toBe(1);
    }
    all.App.emit('appUrlOpen', { url: 'topostack://maps/1' });
    expect(navigate).toHaveBeenCalledWith('/maps/1');

    all.Keyboard.emit('keyboardWillShow', { keyboardHeight: 250 });
    expect(native.keyboard?.visible).toBe(true);

    native.toaster?.success('Saved');
    expect(all.Haptics.notification).toHaveBeenCalledWith({ type: 'SUCCESS' });

    all.Network.emit('networkStatusChange', { connected: false, connectionType: 'none' });
    expect(native.network?.connected).toBe(false);
    expect(native.toaster?.toasts.at(-1)?.title).toBe('You are offline');
    expect(native.lifecycle?.active).toBe(true);
    expect(native.haptics).toBeDefined();

    await native.files?.save({ blob: new Blob(['x']), name: 'notes.txt' });
    expect(all.Filesystem.writeFile).toHaveBeenCalledOnce();
    expect(await native.files?.pick()).toEqual([]);
    expect(all.FilePicker.pickFiles).toHaveBeenCalledOnce();

    native.destroy();
    await flush();
    expect(all.App.count('backButton')).toBe(0);
    expect(document.documentElement).not.toHaveAttribute('data-native-platform');
    theme.destroy();
  });

  it('skips adapters that are switched off', async () => {
    platform.current = 'ios';
    const all = plugins();
    const native = setupCapacitor({
      plugins: all,
      appearance: false,
      backButton: false,
      keyboard: false,
      haptics: false,
      lifecycle: false,
      links: false,
      network: false,
      splash: false,
      textSize: false,
      clipboard: false,
      files: false,
    });
    await native.ready;
    await flush();
    expect(systemBars.setStyle).not.toHaveBeenCalled();
    expect(all.App.addListener).not.toHaveBeenCalled();
    expect(all.Keyboard.addListener).not.toHaveBeenCalled();
    expect(all.SplashScreen.hide).not.toHaveBeenCalled();
    expect(all.TextZoom.getPreferred).not.toHaveBeenCalled();
    expect(native.keyboard).toBeUndefined();
    expect(native.haptics).toBeUndefined();
    expect(native.network).toBeUndefined();
    expect(native.lifecycle).toBeUndefined();
    expect(native.files).toBeUndefined();
    native.destroy();
  });

  it('works with no plugins at all', async () => {
    platform.current = 'ios';
    const toaster = createToaster();
    const native = setupCapacitor({ plugins: {}, toaster });
    await native.ready;
    expect(native.toaster).toBe(toaster);
    expect(native.files).toBeDefined();
    native.destroy();
  });
});
