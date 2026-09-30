/**
 * The published packages whose components the catalog documents. A package is picked up once
 * its `src/lib/components` directory exists; until then it is simply skipped.
 */
import { existsSync } from 'node:fs';

const root = new URL('../../../', import.meta.url);

export const PACKAGES = [
  { id: 'svelte', name: '@loidolt/theme-svelte', dir: 'packages/svelte', readme: 'README.md' },
  { id: 'charts', name: '@loidolt/theme-charts', dir: 'packages/charts' },
  { id: 'maps', name: '@loidolt/theme-maps', dir: 'packages/maps' },
  { id: 'docs', name: '@loidolt/theme-docs', dir: 'packages/docs' },
]
  .map((entry) => ({
    ...entry,
    readme: new URL(entry.readme ?? `${entry.dir}/README.md`, root),
    components: new URL(`${entry.dir}/src/lib/components/`, root),
    barrel: new URL(`${entry.dir}/src/lib/index.ts`, root),
  }))
  .filter((entry) => existsSync(entry.components));
