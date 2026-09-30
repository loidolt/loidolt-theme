import { test as base } from '@playwright/test';

export { expect } from '@playwright/test';

/**
 * The OpenFreeMap TileJSON, pointing tile requests back at the same (intercepted) host. Real
 * tiles are neither needed nor wanted: the sweep checks our markup, not their servers.
 */
const tileJson = {
  tilejson: '3.0.0',
  name: 'offline fixture',
  tiles: ['https://tiles.openfreemap.org/planet/fixture/{z}/{x}/{y}.pbf'],
  minzoom: 0,
  maxzoom: 14,
  vector_layers: [],
  attribution: 'OpenFreeMap © OpenMapTiles Data from OpenStreetMap',
};

/**
 * Keeps every test off the network. Pages are served from the local preview; the map tile host
 * gets an empty-but-valid answer (an empty protobuf is a valid tile and a valid glyph range), and
 * anything else external is refused, so a demo that quietly phones home fails here first.
 */
export const test = base.extend<{ noNetwork: void }>({
  noNetwork: [
    async ({ page }, use) => {
      await page.route(/^https?:\/\/(?!127\.0\.0\.1[:/]|localhost[:/])/, (route) => {
        const url = new URL(route.request().url());
        if (url.hostname !== 'tiles.openfreemap.org') return route.abort('blockedbyclient');
        if (url.pathname === '/planet') return route.fulfill({ json: tileJson });
        return route.fulfill({
          status: 200,
          contentType: 'application/x-protobuf',
          body: Buffer.alloc(0),
        });
      });
      await use();
    },
    { auto: true },
  ],
});
