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

/** The declarations of the one rule whose selector is exactly `selector`. */
const rule = (selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const css = sheet.replace(/\/\*[\s\S]*?\*\//g, '');
  const found = css.match(new RegExp(`(?:^|\\})\\s*${escaped} \\{([^}]*)\\}`));
  expect(found, selector).not.toBeNull();
  return found![1];
};

describe('styles.css on iPhone Duo', () => {
  it('widens the safe area on the bar edge into a strip every inset reader clears', () => {
    for (const side of ['right', 'left']) {
      const body = rule(`:where(:root[data-bar-edge='${side}'])`);
      expect(body).toContain(
        `--ldt-bar-width: max(var(--safe-area-inset-${side}, env(safe-area-inset-${side}, 0px)), 4.5rem);`
      );
      expect(body).toContain(`--ldt-safe-${side}: var(--ldt-bar-width);`);
    }
  });

  it('stacks the TabBar at the foot of the strip and Topbar actions below what is reserved', () => {
    const tabs = rule(':where([data-bar-edge] .ldt-app-shell > .ldt-tab-bar)');
    expect(tabs).toContain('position: fixed;');
    expect(tabs).toContain('flex-direction: column;');
    expect(tabs).toContain('justify-content: flex-end;');
    expect(tabs).toContain('width: var(--ldt-bar-width);');
    const actions = rule(':where([data-bar-edge] .ldt-topbar__actions)');
    expect(actions).toContain('top: var(--ldt-bar-start, 0px);');
    expect(actions).toContain('flex-direction: column;');
    // The current tab's indicator faces the content, not the screen edge.
    expect(
      rule(":where([data-bar-edge='right'] .ldt-tab-bar__item[aria-current='page'])")
    ).toContain('inset var(--loidolt-stroke-indicator) 0 0');
  });

  it('moves centred overlays to one side of the fold, and keeps side drawers short of it', () => {
    const dialog = rule(":where([data-fold='vertical'] .ldt-dialog)");
    expect(dialog).toContain('left: calc(var(--ldt-fold-start) / 2);');
    expect(dialog).toContain('calc(var(--ldt-fold-start) - 2rem)');
    expect(rule(":where([data-fold='horizontal'] .ldt-dialog)")).toContain(
      'top: calc(var(--ldt-fold-start) / 2);'
    );
    expect(
      rule(":where([data-fold='vertical'] :is(.ldt-drawer--top, .ldt-drawer--bottom))")
    ).toContain('width: var(--ldt-fold-start);');
    expect(rule(":where([data-fold='vertical'] .ldt-drawer--right)")).toContain(
      'calc(100vw - var(--ldt-fold-end))'
    );
    expect(rule(":where([data-fold='vertical'] .ldt-toast-viewport)")).toContain(
      'var(--ldt-fold-end)'
    );
  });
});
