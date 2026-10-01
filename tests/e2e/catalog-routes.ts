import { entries } from '../../examples/catalog/src/lib/registry.js';

const staticRoutes = ['/', '/404', '/components', '/foundations', '/patterns'];

export const catalogRoutes = [
  ...staticRoutes,
  ...entries.map((entry) => `/components/${entry.slug}`),
].sort();
