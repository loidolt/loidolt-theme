import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * The self-contained stylesheets `@loidolt/theme-styles` builds into `dist/` for pages with no
 * bundler, such as a generated HTML report. `npm run build:packages` (part of `npm run check`)
 * builds them before the tests run.
 */
const stylesRoot = path.join(process.cwd(), '..', 'styles');
const read = (file: string) => readFileSync(path.join(stylesRoot, file), 'utf8');
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '');
const urls = (css: string) =>
  [...stripComments(css).matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g)].map(([, , url]) => url);
const componentFiles = readdirSync(path.join(stylesRoot, 'src', 'components')).filter((file) =>
  file.endsWith('.css')
);
/** Every `.ldt-*` class a component stylesheet defines. */
const classesIn = (css: string) =>
  new Set([...stripComments(css).matchAll(/\.(ldt-[\w-]+)/g)].map(([, name]) => name));

const standalone = read('dist/standalone.css');
const core = read('dist/standalone-core.css');
const fonts = read('dist/fonts-embedded.css');

describe('standalone stylesheets', () => {
  it('publishes each one', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.files).toContain('dist');
    for (const name of ['standalone.css', 'standalone-core.css', 'fonts-embedded.css']) {
      expect(pkg.exports[`./${name}`]).toBe(`./dist/${name}`);
      expect(existsSync(path.join(stylesRoot, 'dist', name))).toBe(true);
    }
  });

  it.each([
    ['standalone.css', standalone],
    ['standalone-core.css', core],
    ['fonts-embedded.css', fonts],
  ])('leaves no @import and no url() to a file in %s', (_, css) => {
    expect(stripComments(css)).not.toMatch(/@import\b/);
    for (const url of urls(css)) expect(url).toMatch(/^data:/);
  });

  it('declares the layer order before any rule', () => {
    for (const css of [standalone, core]) {
      expect(stripComments(css).trim()).toMatch(
        /^@layer loidolt\.tokens, loidolt\.reset, loidolt\.base, loidolt\.vendor, loidolt\.components,\s+loidolt\.utilities, loidolt\.a11y;/
      );
    }
  });

  it('carries the tokens and the base styles, and ends with dark-auto unlayered', () => {
    // Unlayered, as `@import '@loidolt/theme-styles/dark-auto'` leaves it: in a layer, its
    // `color-scheme: dark` would lose to the base layer's `color-scheme: light`.
    const darkAuto = stripComments(
      readFileSync(path.join(stylesRoot, '..', 'tokens', 'dist', 'dark-auto.css'), 'utf8')
    ).trim();
    expect(darkAuto).toContain("[data-theme='dark'] {");
    expect(darkAuto).toContain(
      "@media (prefers-color-scheme: dark) {\n  :root:not([data-theme='light'])"
    );
    for (const css of [standalone, core]) {
      expect(css).toContain('@layer loidolt.tokens {\n:root {');
      expect(css).toMatch(/--loidolt-background: #[0-9a-f]{6};/);
      expect(css).toContain('@layer loidolt.base {');
      expect(css.trimEnd().endsWith(`}\n\n${darkAuto}`)).toBe(true);
      expect(css).toContain('@layer loidolt.a11y {');
      expect(css).not.toContain('@font-face');
    }
  });

  it('includes every component class in the full bundle', () => {
    const bundled = classesIn(standalone);
    for (const file of componentFiles) {
      const own = classesIn(read(`src/components/${file}`));
      expect(own.size, file).toBeGreaterThan(0);
      for (const name of own) expect(bundled.has(name), `${file}: .${name}`).toBe(true);
    }
  });

  it('leaves the extras out of the core bundle', () => {
    expect(core).toContain('.ldt-button');
    expect(core).toContain('.ldt-card');
    expect(core).not.toContain('.ldt-prose');
    expect(core.length).toBeLessThan(standalone.length);
  });

  it('keeps each component group self-contained, so groups can be concatenated by hand', () => {
    for (const file of componentFiles) {
      const css = read(`src/components/${file}`);
      expect(stripComments(css), file).not.toMatch(/@import\b/);
      for (const url of urls(css)) expect(url).toMatch(/^data:/);
    }
  });

  it('embeds both font faces as WOFF2 data URIs with font-display: swap', () => {
    const faces = stripComments(fonts).match(/@font-face \{[^}]+\}/g) ?? [];
    expect(faces).toHaveLength(2);
    expect(faces.join('\n')).toContain("font-family: 'Jost'");
    expect(faces.join('\n')).toContain("font-family: 'Archivo'");
    for (const face of faces) {
      expect(face).toContain("url('data:font/woff2;base64,");
      expect(face).toContain('font-display: swap');
    }
    const jost = readFileSync(path.join(stylesRoot, 'src', 'fonts', 'Jost-Medium.woff2'));
    expect(fonts).toContain(jost.toString('base64'));
  });
});
