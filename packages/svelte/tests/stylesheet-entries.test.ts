import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Sibling package's source, resolved from the package root Vitest runs in. */
const stylesDir = path.join(process.cwd(), '..', 'styles', 'src');
const read = (file: string) => readFileSync(path.join(stylesDir, file), 'utf8');
const imports = (file: string) =>
  [
    ...read(file)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .matchAll(/@import '([^']+)'([^;]*);/g),
  ].map(([, target, layer]) => ({ target, layer: layer.trim() }));
const componentFiles = readdirSync(path.join(stylesDir, 'components'))
  .filter((file) => file.endsWith('.css'))
  .map((file) => `./components/${file}`)
  .sort();

describe('stylesheet entry points', () => {
  it('imports every component stylesheet from the components aggregate', () => {
    expect(
      imports('components.css')
        .map(({ target }) => target)
        .sort()
    ).toEqual(componentFiles);
  });

  it('makes the full stylesheet exactly core plus the extras', () => {
    const index = imports('index.css');
    expect(index[0]).toEqual({ target: './core.css', layer: '' });
    const core = imports('core.css').filter(({ target }) => target.startsWith('./components/'));
    const extras = index.slice(1);
    const all = [...core, ...extras].map(({ target }) => target);
    expect(new Set(all).size).toBe(all.length);
    expect([...all].sort()).toEqual(componentFiles);
    for (const { layer } of [...core, ...extras]) expect(layer).toBe('layer(loidolt.components)');
  });

  it('keeps the components in the same cascade order as the aggregate', () => {
    const order = imports('components.css').map(({ target }) => target);
    const entries = [
      ...imports('core.css').filter(({ target }) => target.startsWith('./components/')),
      ...imports('index.css').slice(1),
    ].map(({ target }) => target);
    expect(entries).toEqual(order);
  });

  it('declares the layer order before core imports anything', () => {
    const core = read('core.css').replace(/\/\*[\s\S]*?\*\//g, '');
    expect(core.indexOf('@layer loidolt.tokens')).toBeGreaterThanOrEqual(0);
    expect(core.indexOf('@layer loidolt.tokens')).toBeLessThan(core.indexOf('@import'));
  });

  it('publishes core and each component stylesheet', () => {
    const pkg = JSON.parse(read('../package.json'));
    expect(pkg.exports['./core']).toBe('./src/core.css');
    expect(pkg.exports['./components/*']).toBe('./src/components/*.css');
  });
});
