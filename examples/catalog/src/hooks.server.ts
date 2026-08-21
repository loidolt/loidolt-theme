import type { Handle } from '@sveltejs/kit';
import { themeScript } from '@loidolt/theme-svelte';

/**
 * Inlines the blocking theme resolve into `<head>` at prerender time, so a reload paints in the
 * stored scheme instead of flashing light and correcting itself. The generated source contains
 * no `<`, so it needs no escaping inside the script element in `app.html`.
 */
export const handle: Handle = ({ event, resolve }) =>
  resolve(event, {
    transformPageChunk: ({ html }) => html.replace('%loidolt.theme%', themeScript()),
  });
