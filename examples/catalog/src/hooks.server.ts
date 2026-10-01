import type { Handle } from '@sveltejs/kit';
import { base } from '$app/paths';
import { themeScript } from '@loidolt/theme-svelte';
import { parsePreview, presets } from '$lib/presets.js';

/**
 * Inlines the blocking theme resolve into `<head>` at prerender time, so a reload paints in the
 * stored scheme and preset instead of flashing the defaults and correcting itself. The generated
 * source contains no `<`, so it needs no escaping inside the script element in `app.html`.
 *
 * Preview frames are the exception: their preset and scheme come from the URL, so they are
 * written onto `<html>` directly and the stored choice is never consulted. `parsePreview` only
 * matches known names, so the values are safe to interpolate.
 */
export const handle: Handle = ({ event, resolve }) => {
  const preview = parsePreview(event.url.pathname.slice(base.length));
  return resolve(event, {
    transformPageChunk: ({ html }) =>
      preview
        ? html
            .replace('%loidolt.theme%', '')
            .replace(
              '<html lang="en">',
              `<html lang="en" data-preset="${preview.preset}" data-theme="${preview.scheme}">`
            )
        : html.replace('%loidolt.theme%', themeScript({ presets })),
  });
};
