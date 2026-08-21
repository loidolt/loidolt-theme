import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

// Paths come off `process.cwd()` (the package root under Vitest) rather than `import.meta.url`,
// which the jsdom environment rewrites to a non-`file:` URL.
const packageRoot = process.cwd();
const distPath = (file: string) => path.join(packageRoot, 'dist', file);
const built = existsSync(distPath('index.js'));

/**
 * Guards the *published* surface rather than the source tree. Requires `npm run build` first,
 * which `npm run check` and CI both do; a bare `npm test` on a fresh clone skips it instead of
 * failing on a missing `dist`.
 */
describe.skipIf(!built)('published package shape', () => {
  it('exports every component from the built barrel', async () => {
    const dist = await import(/* @vite-ignore */ pathToFileURL(distPath('index.js')).href);
    // The source barrel is the contract: a build that drops any export fails here.
    const src = await import('../src/lib/index.js');
    const names = Object.keys(src).sort();
    expect(names.length).toBeGreaterThan(40);
    expect(Object.keys(dist).sort()).toEqual(names);
    expect(dist.cx).toBeTypeOf('function');
    expect(dist.createToaster).toBeTypeOf('function');
  });

  it('ships a stylesheet and type declarations alongside it', async () => {
    expect(existsSync(distPath('styles.css'))).toBe(true);
    expect(existsSync(distPath('index.d.ts'))).toBe(true);

    const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    expect(pkg.exports['.']).toMatchObject({
      types: './dist/index.d.ts',
      svelte: './dist/index.js',
      default: './dist/index.js',
    });
    expect(pkg.exports['./package.json']).toBe('./package.json');
  });

  it('leaves the components uncompiled so consumers can tree-shake them', async () => {
    const source = await readFile(distPath('components/Button.svelte'), 'utf8');
    expect(source).toContain('<script');
  });
});

it('reports when the dist smoke test was skipped', () => {
  if (!built) console.warn('dist/ not built — package-shape assertions skipped');
  expect(true).toBe(true);
});
