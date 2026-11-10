import type { getCurrentWindow } from '@tauri-apps/api/window';
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
});
