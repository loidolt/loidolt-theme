import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/** Sibling package's source, resolved from the package root Vitest runs in. */
const stylesDir = path.join(process.cwd(), '..', 'styles', 'src');
const read = (file: string) => readFileSync(path.join(stylesDir, file), 'utf8');
const stylesheets = [
  'components/layout.css',
  'components/overlays.css',
  'components/feedback.css',
].map((file) => ({ file, source: read(file).replace(/\/\*[\s\S]*?\*\//g, '') }));

/** Every rule as `selector { body }`, flattened out of at-rules; enough for these files. */
const rules = stylesheets.flatMap(({ source }) =>
  [...source.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, selector, body]) => ({
    selector: selector.trim().replace(/\s+/g, ' '),
    body,
  }))
);
const rulesFor = (needle: string) => rules.filter((rule) => rule.selector.includes(needle));

describe('safe-area insets', () => {
  /*
   * The whole promise to existing apps is that this is a no-op on desktop: every inset must
   * fall back to `0px`, so a browser without `env()` support or without a notch adds nothing,
   * and must read its `--ldt-safe-*` knob first, so an element can opt out.
   */
  it('reads every env() inset through its --ldt-safe-* knob with a 0px fallback', () => {
    const uses = stylesheets.flatMap(({ file, source }) =>
      [...source.matchAll(/env\(([^)]*)\)/g)].map((match) => ({ file, match }))
    );
    expect(uses.length).toBeGreaterThan(0);
    for (const { file, match } of uses) {
      const [, args] = match;
      const edge = /^safe-area-inset-(top|right|bottom|left), 0px$/.exec(args)?.[1];
      expect(edge, `${file}: env(${args}) needs a 0px fallback`).toBeDefined();
      const before = match.input!.slice(0, match.index);
      expect(before.endsWith(`var(--ldt-safe-${edge}, `), `${file}: env(${args})`).toBe(true);
    }
  });

  it.each([
    ['.ldt-topbar', ['top', 'right', 'left']],
    ['.ldt-app-shell >', ['right', 'bottom', 'left']],
    ['.ldt-drawer--', ['top', 'right', 'bottom', 'left']],
    ['.ldt-toast-viewport', ['top', 'right', 'bottom', 'left']],
    ['.ldt-floating-bar--', ['top', 'right', 'bottom', 'left']],
    ['.ldt-tab-bar', ['right', 'bottom', 'left']],
  ])('pads %s clear of the %j insets', (selector, edges) => {
    const bodies = rulesFor(selector)
      .map((rule) => rule.body)
      .join('\n');
    for (const edge of edges) expect(bodies, `${selector} ${edge}`).toContain(`--ldt-safe-${edge}`);
  });

  it('adds the top inset to the topbar height rather than taking it out of it', () => {
    const topbar = rulesFor('.ldt-topbar').find((rule) => rule.selector === '.ldt-topbar');
    expect(topbar?.body).toMatch(
      /min-height:\s*calc\(var\(--loidolt-size-topbar\) \+ var\(--ldt-safe-top/
    );
  });

  // New padding on rows that had none must never beat an app's own padding on them.
  it('declares the AppShell and Drawer insets at zero specificity', () => {
    for (const rule of [...rulesFor('.ldt-app-shell >'), ...rulesFor('.ldt-drawer--')]) {
      if (!/--ldt-safe-/.test(rule.body) || /animation/.test(rule.body)) continue;
      expect(rule.selector.startsWith(':where('), rule.selector).toBe(true);
    }
  });
});

describe('TabBar styles', () => {
  const item = rulesFor('.ldt-tab-bar__item').find(
    (rule) => rule.selector === '.ldt-tab-bar__item'
  )!;

  it('gives every destination a 44px minimum touch target', () => {
    expect(item.body).toMatch(/min-width:\s*44px/);
    expect(item.body).toMatch(/min-height:\s*max\(44px,/);
  });

  it('draws the current indicator with the stroke-indicator token', () => {
    const current = rulesFor("[aria-current='page']").find((rule) =>
      rule.selector.startsWith('.ldt-tab-bar__item')
    );
    expect(current?.body).toContain('var(--loidolt-stroke-indicator)');
    expect(current?.body).toContain('var(--loidolt-accent)');
  });
});
