import type { getCurrentWindow } from '@tauri-apps/api/window';
import type * as notification from '@tauri-apps/plugin-notification';
import type * as event from '@tauri-apps/api/event';
import type * as menu from '@tauri-apps/api/menu';
import type * as tray from '@tauri-apps/api/tray';
import type * as deepLink from '@tauri-apps/plugin-deep-link';
import type * as os from '@tauri-apps/plugin-os';
import { describe, expectTypeOf, it } from 'vitest';
import type { TauriPlugins } from '../src/lib/index.js';
import type * as Shapes from '../src/lib/types.js';

/**
 * The adapters describe the Tauri modules structurally instead of importing them. These
 * assertions are checked by `svelte-check` against the real typings, so a Tauri release that
 * changes a signature the adapters rely on fails the type-check here, not in an app.
 */
describe('the real modules fit the adapters', () => {
  it('fits the os plugin', () => {
    expectTypeOf<typeof os>().toExtend<Shapes.OsPlugin>();
    expectTypeOf<typeof os>().toExtend<NonNullable<TauriPlugins['os']>>();
  });

  it('fits the window from getCurrentWindow()', () => {
    type CurrentWindow = ReturnType<typeof getCurrentWindow>;
    expectTypeOf<CurrentWindow>().toExtend<Shapes.WindowPlugin>();
    expectTypeOf<CurrentWindow>().toExtend<NonNullable<TauriPlugins['window']>>();
    expectTypeOf<typeof getCurrentWindow>().toExtend<NonNullable<TauriPlugins['window']>>();
  });

  it('fits the notification plugin', () => {
    expectTypeOf<typeof notification>().toExtend<Shapes.NotificationPlugin>();
    expectTypeOf<typeof notification>().toExtend<NonNullable<TauriPlugins['notification']>>();
  });

  it('fits the event module', () => {
    expectTypeOf<typeof event>().toExtend<Shapes.EventModule>();
    expectTypeOf<typeof event>().toExtend<NonNullable<TauriPlugins['event']>>();
  });

  it('fits the deep-link plugin', () => {
    expectTypeOf<typeof deepLink>().toExtend<Shapes.DeepLinkPlugin>();
    expectTypeOf<typeof deepLink>().toExtend<NonNullable<TauriPlugins['deepLink']>>();
  });

  it('fits the tray and menu modules', () => {
    expectTypeOf<typeof tray>().toExtend<Shapes.TrayModule>();
    expectTypeOf<typeof menu>().toExtend<Shapes.MenuModule>();
    expectTypeOf<typeof tray>().toExtend<NonNullable<TauriPlugins['tray']>>();
    expectTypeOf<typeof menu>().toExtend<NonNullable<TauriPlugins['menu']>>();
  });
});
