import { readFileSync } from 'node:fs';

// Read at collection time so every route becomes its own test with its own timeout. A single
// test looping over every page outgrew any fixed budget as the catalog grew, and one slow page
// hid the results of every page after it.
const registry = readFileSync(
  new URL('../../examples/catalog/src/lib/registry.ts', import.meta.url),
  'utf8'
);

export const componentRoutes = [...registry.matchAll(/^\s+slug: '([\w-]+)',$/gm)].map(
  ([, slug]) => `/components/${slug}`
);

export const staticRoutes = ['/', '/404', '/components', '/foundations', '/patterns'];

export const routes = [...staticRoutes, ...componentRoutes].sort();
