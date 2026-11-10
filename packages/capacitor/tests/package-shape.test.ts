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

  it('ships a config entry that Node can run without Svelte, a DOM or Capacitor', async () => {
    const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    expect(pkg.exports['./config']).toEqual({
      types: './dist/config/index.d.ts',
      default: './dist/config/index.js',
    });
    for (const file of await readdir(distPath('config'))) {
      if (!file.endsWith('.js')) continue;
      const code = (await readFile(distPath(`config/${file}`), 'utf8')).replace(
        /\/\*[\s\S]*?\*\//g,
        ''
      );
      expect(code, file).not.toMatch(
        /from '(svelte|@capacitor|@loidolt\/theme-svelte)|\b(document|window)\./
      );
      expect(code, file).toMatch(/from '@loidolt\/theme-tokens'/);
    }
  });

  it('ships the stylesheet', () => {
    expect(existsSync(distPath('styles.css'))).toBe(true);
  });
});

it('reports when the dist smoke test was skipped', () => {
  if (!built) console.warn('dist/ not built — package-shape assertions skipped');
  expect(true).toBe(true);
});
