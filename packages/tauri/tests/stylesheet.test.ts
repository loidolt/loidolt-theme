import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (...parts: string[]) => readFileSync(path.join(process.cwd(), ...parts), 'utf8');
const sheet = read('src', 'styles.css');
const theme = readdirSync(path.join(process.cwd(), '..', 'styles', 'src', 'components'))
  .map((file) => read('..', 'styles', 'src', 'components', file))
  .join('\n');

/** Every selector in a sheet, comments stripped. */
const selectors = (css: string) =>
  css
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}')
    .map((block) => block.split('{')[0].trim())
    .filter(Boolean);

describe('styles.css', () => {
  it('only styles classes the theme defines', () => {
    const used = new Set(sheet.match(/\.ldt-[a-z0-9_-]+/g));
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) expect(theme, name).toContain(`${name} `);
  });

  it('is zero-specificity throughout, so the app always wins', () => {
    for (const selector of selectors(sheet)) expect(selector).toMatch(/^:where\(/);
  });

  it('is inert outside a Tauri window', () => {
    for (const selector of selectors(sheet)) {
      expect(selector).toMatch(/^:where\(\[data-tauri-platform/);
    }
  });
});
