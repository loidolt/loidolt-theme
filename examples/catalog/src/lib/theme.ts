import { createTheme } from '@loidolt/theme-svelte';

/**
 * One theme instance for the whole site. Created at module scope on purpose: every page reads
 * the same preference, and there is no component whose lifetime it should be tied to.
 *
 * The first paint is handled separately, by `themeScript()` in `src/hooks.server.ts` — this
 * store takes over once the app is running.
 */
export const theme = createTheme();
