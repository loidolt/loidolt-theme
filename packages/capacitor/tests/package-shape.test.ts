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

describe('native iOS half', () => {
  it('is declared for `cap sync` and published with the package', async () => {
    const pkg = JSON.parse(await readFile(path.join(packageRoot, 'package.json'), 'utf8'));
    expect(pkg.capacitor).toEqual({ ios: { src: 'ios' } });
    expect(pkg.files).toEqual(expect.arrayContaining(['Package.swift', 'ios/Sources']));
    const manifest = await readFile(path.join(packageRoot, 'Package.swift'), 'utf8');
    const source = manifest.match(/path: "([^"]+)"/)?.[1];
    expect(source).toBe('ios/Sources/DeviceLayoutPlugin');
    expect(existsSync(path.join(packageRoot, source!, 'DeviceLayoutPlugin.swift'))).toBe(true);
  });

  it('answers to the name the JavaScript side registers', async () => {
    const swift = await readFile(
      path.join(packageRoot, 'ios/Sources/DeviceLayoutPlugin/DeviceLayoutPlugin.swift'),
      'utf8'
    );
    const ts = await readFile(path.join(packageRoot, 'src/lib/device-layout.svelte.ts'), 'utf8');
    expect(swift).toMatch(/jsName = "DeviceLayout"/);
    expect(ts).toMatch(/registerPlugin<DeviceLayoutPlugin>\('DeviceLayout'\)/);
    expect(swift).toMatch(/notifyListeners\("change"/);
  });
});

it('reports when the dist smoke test was skipped', () => {
  if (!built) console.warn('dist/ not built — package-shape assertions skipped');
  expect(true).toBe(true);
});
