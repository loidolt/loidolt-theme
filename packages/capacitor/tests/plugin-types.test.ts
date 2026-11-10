import type { AppPlugin } from '@capacitor/app';
import type { BrowserPlugin } from '@capacitor/browser';
import type { ClipboardPlugin } from '@capacitor/clipboard';
import type { SystemBars } from '@capacitor/core';
import type { FilesystemPlugin } from '@capacitor/filesystem';
import type { HapticsPlugin } from '@capacitor/haptics';
import type { KeyboardPlugin } from '@capacitor/keyboard';
import type { NetworkPlugin } from '@capacitor/network';
import type { PreferencesPlugin } from '@capacitor/preferences';
import type { SharePlugin } from '@capacitor/share';
import type { SplashScreenPlugin } from '@capacitor/splash-screen';
import type { StatusBarPlugin } from '@capacitor/status-bar';
import type { TextZoomPlugin } from '@capacitor/text-zoom';
import { describe, expectTypeOf, it } from 'vitest';
import type { CapacitorPlugins } from '../src/lib/index.js';
import type * as Shapes from '../src/lib/types.js';

/**
 * The adapters describe the plugins structurally instead of importing them. These assertions are
 * checked by `svelte-check` against the real plugin typings, so a Capacitor release that changes
 * a signature the adapters rely on fails the type-check here, not in an app.
 */
describe('the real plugins fit the adapters', () => {
  it('fits every App role', () => {
    expectTypeOf<AppPlugin>().toExtend<Shapes.BackButtonPlugin>();
    expectTypeOf<AppPlugin>().toExtend<Shapes.AppStatePlugin>();
    expectTypeOf<AppPlugin>().toExtend<Shapes.AppUrlPlugin>();
    expectTypeOf<AppPlugin>().toExtend<Shapes.AppResumePlugin>();
    expectTypeOf<AppPlugin>().toExtend<NonNullable<CapacitorPlugins['App']>>();
  });

  it('fits the rest', () => {
    expectTypeOf<BrowserPlugin>().toExtend<Shapes.BrowserPlugin>();
    expectTypeOf<ClipboardPlugin>().toExtend<Shapes.ClipboardPlugin>();
    expectTypeOf<FilesystemPlugin>().toExtend<Shapes.FilesystemPlugin>();
    expectTypeOf<HapticsPlugin>().toExtend<Shapes.HapticsPlugin>();
    expectTypeOf<KeyboardPlugin>().toExtend<NonNullable<CapacitorPlugins['Keyboard']>>();
    expectTypeOf<NetworkPlugin>().toExtend<Shapes.NetworkPlugin>();
    expectTypeOf<PreferencesPlugin>().toExtend<Shapes.PreferencesPlugin>();
    expectTypeOf<SharePlugin>().toExtend<Shapes.SharePlugin>();
    expectTypeOf<SplashScreenPlugin>().toExtend<Shapes.SplashScreenPlugin>();
    expectTypeOf<StatusBarPlugin>().toExtend<Shapes.StatusBarPlugin>();
    expectTypeOf<typeof SystemBars>().toExtend<Shapes.SystemBarsPlugin>();
    expectTypeOf<TextZoomPlugin>().toExtend<Shapes.TextZoomPlugin>();
  });
});
