import { base } from '$app/paths';
import { createTheme } from '@loidolt/theme-svelte';
import { parsePreview, presets } from './presets.js';

export { presets };

/*
 * A preview frame on /presets renders one preset in one scheme, stamped onto `<html>` by
 * `hooks.server.ts`. The site's own choice must not reach it: neither on load nor through the
 * cross-tab `storage` event, which would otherwise repaint every frame whenever the picker in
 * the parent page changes. So inside a frame the store keeps nothing and writes to an element
 * that is never attached.
 */
const previewing =
  typeof location !== 'undefined' && parsePreview(location.pathname.slice(base.length)) !== null;

/**
 * One theme instance for the whole site. Created at module scope on purpose: every page reads
 * the same preference, and there is no component whose lifetime it should be tied to.
 *
 * The first paint is handled separately, by `themeScript()` in `src/hooks.server.ts` — this
 * store takes over once the app is running.
 */
export const theme = createTheme(
  previewing
    ? { presets, storageKey: null, presetStorageKey: null, element: document.createElement('div') }
    : { presets }
);
