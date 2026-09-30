import { existsSync } from 'node:fs';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

const packageRoot = process.cwd();
const distPath = (file: string) => path.join(packageRoot, 'dist', file);
const built = existsSync(distPath('index.js'));

describe.skipIf(!built)('published package shape', () => {
  it('exports everything from the built barrel', async () => {
    const dist = await import(/* @vite-ignore */ pathToFileURL(distPath('index.js')).href);
    const src = await import('../src/lib/index.js');
    expect(Object.keys(dist).sort()).toEqual(Object.keys(src).sort());
  }, 30_000);

  it('ships a core entry that is plain JavaScript', async () => {
    const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    expect(pkg.exports['./core']).toEqual({
      types: './dist/core/index.d.ts',
      default: './dist/core/index.js',
    });
    const core = await import(/* @vite-ignore */ pathToFileURL(distPath('core/index.js')).href);
    expect(core.renderMarkdown).toBeTypeOf('function');
    for (const file of await readdir(distPath('core'), { recursive: true })) {
      if (!String(file).endsWith('.js')) continue;
      const source = await readFile(distPath(`core/${file}`), 'utf8');
      expect(source, String(file)).not.toMatch(/\.svelte['"]|from 'shiki'|from 'mermaid'/);
    }
  }, 30_000);
});

it('reports when the dist smoke test was skipped', () => {
  if (!built) console.warn('dist/ not built — package-shape assertions skipped');
  expect(true).toBe(true);
});
