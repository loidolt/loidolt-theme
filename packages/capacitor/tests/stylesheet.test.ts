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
  it('feeds every safe-area knob the theme reads, from Capacitor first and env() second', () => {
    for (const edge of ['top', 'right', 'bottom', 'left']) {
      expect(theme).toContain(`--ldt-safe-${edge}`);
      expect(sheet).toContain(
        `--ldt-safe-${edge}: var(--safe-area-inset-${edge}, env(safe-area-inset-${edge}, 0px));`
      );
    }
  });

  it('only styles classes the theme defines', () => {
    const used = new Set(sheet.match(/\.ldt-[a-z0-9_-]+/g));
    expect(used.size).toBeGreaterThan(0);
    for (const name of used) expect(theme, name).toContain(`${name} `);
  });

  it('is zero-specificity throughout, so the app always wins', () => {
    for (const selector of selectors(sheet)) expect(selector).toMatch(/^:where\(/);
  });

  it('keeps scrolled content out from under the status bar in a native shell', () => {
    // Topbar scrolls away with the page; without a backdrop the page ran under the clock.
    const rule = sheet.match(/:where\(\[data-native-platform\] body\)::before \{([^}]*)\}/);
    expect(rule, 'status bar backdrop').not.toBeNull();
    const body = rule![1];
    expect(body).toContain('position: fixed;');
    expect(body).toContain('height: var(--ldt-safe-top);');
    expect(body).toContain('background: var(--loidolt-surface);');
    expect(body).toContain('pointer-events: none;');
  });

  it('stops a double tap zooming the page in a native shell, and leaves pinch zoom', () => {
    const rule = sheet.match(/:where\(\[data-native-platform\]\) \{([^}]*)\}/);
    expect(rule, 'native touch manners').not.toBeNull();
    expect(rule![1]).toContain('touch-action: manipulation;');
  });
});
