import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  colors,
  darkSemantic,
  flattenTokens,
  generateCss,
  generateDarkCss,
  semantic,
  tokens,
} from './index.js';

const css = generateCss();
const declared = new Set(flattenTokens().map(([name]) => name));

describe('theme tokens', () => {
  it('keeps the shared application palette stable', () => {
    expect(colors).toMatchObject({
      paper: '#ebe7dc',
      panel: '#f5f2e9',
      deep: '#20231d',
      orange: '#c65224',
    });
    expect(tokens.typography.display).toContain('Jost');
  });

  it('generates the documented public CSS properties', () => {
    expect(css).toContain('--loidolt-color-paper: #ebe7dc');
    expect(css).toContain('--loidolt-accent: var(--loidolt-color-orange)');
  });

  it('kebab-cases every segment of a nested token path', () => {
    // Regression: the old generator only kebab-cased the leaf, emitting
    // `--loidolt-font-lineHeight-tight` while the stylesheets read
    // `--loidolt-font-line-height-tight`, so every line-height silently fell back.
    expect(css).toContain('--loidolt-font-line-height-tight: 1.15');
    expect(css).toContain('--loidolt-color-panel-alt:');
    expect(css).toContain('--loidolt-size-control-sm:');
    expect(css).toContain('--loidolt-border-radius-pill: 999px');
    expect([...declared].filter((name) => /[A-Z]/.test(name))).toEqual([]);
  });

  it('emits token-to-token links as var() references, not resolved values', () => {
    expect(css).toContain('--loidolt-accent-hover: var(--loidolt-color-orange-dark)');
    expect(css).toContain('--loidolt-surface: var(--loidolt-color-panel)');
  });

  it('never emits a var() reference to a token that is not declared', () => {
    // Guards both `ref()` links and raw `var(--loidolt-…)` strings embedded in values
    // (shadows, scrim): renaming a token must not leave dangling references behind.
    for (const source of [css, generateDarkCss('auto')]) {
      for (const [, name] of source.matchAll(/var\((--loidolt-[a-z0-9-]+)\)/g)) {
        expect(declared.has(name), `dangling token reference ${name}`).toBe(true);
      }
    }
  });

  it('keeps every declaration name unique', () => {
    const names = flattenTokens().map(([name]) => name);
    expect(names.length).toBe(new Set(names).size);
  });

  it('resolves the semantic layer for JS consumers', () => {
    expect(semantic.surface).toBe(colors.panel);
    expect(semantic.accent).toBe(colors.orange);
    expect(tokens.semantic.text).toBe(colors.deep);
  });

  it('has full parity between the token object and the generated variables', () => {
    const walk = (prefix: string[], value: unknown): string[] =>
      typeof value === 'string'
        ? [prefix.join('.')]
        : Object.entries(value as object).flatMap(([key, next]) => walk([...prefix, key], next));

    const leaves = walk([], tokens).filter(
      // `breakpoints` are media-query values, and `darkSemantic` is emitted into its own
      // scoped stylesheet — neither belongs in the `:root` block this asserts against.
      (path) => !path.startsWith('breakpoints.') && !path.startsWith('darkSemantic.')
    );
    expect(leaves.length).toBe(declared.size);
  });
});

describe('stylesheet variable references', () => {
  const stylesDir = new URL('../../styles/src/', import.meta.url);

  it('resolves every var(--loidolt-*) used by @loidolt/theme-styles', async () => {
    const files = (await readdir(stylesDir)).filter((file) => file.endsWith('.css'));
    expect(files.length).toBeGreaterThan(0);

    const missing = new Map<string, string[]>();
    for (const file of files) {
      const source = await readFile(new URL(file, stylesDir), 'utf8');
      for (const [, name] of source.matchAll(/var\((--loidolt-[a-z0-9-]+)/g)) {
        if (!declared.has(name)) missing.set(name, [...(missing.get(name) ?? []), file]);
      }
    }
    expect(Object.fromEntries(missing)).toEqual({});
  });

  it('never lets a stylesheet reach past the semantic layer for colour', async () => {
    const source = await readFile(new URL('components.css', stylesDir), 'utf8');
    const primitives = [...source.matchAll(/var\((--loidolt-color-[a-z0-9-]+)/g)].map((m) => m[1]);
    expect([...new Set(primitives)]).toEqual([]);
  });
});

/** Relative luminance and contrast ratio per WCAG 2.1 §1.4.3. */
const luminance = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((index) => parseInt(hex.slice(index, index + 2), 16) / 255)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

const contrast = (a: string, b: string) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

describe.each([
  ['light', semantic],
  ['dark', darkSemantic],
])('colour contrast (%s)', (_theme, t) => {
  // Small utility text (`--loidolt-font-size-xs`) is well under 18.66px, so every one of these
  // pairs needs the full 4.5:1 rather than the large-text allowance.
  const textPairs: Array<[string, string, string]> = [
    ['accent text on background', t.textAccent, t.background],
    ['accent text on surface', t.textAccent, t.surface],
    ['accent text on surface-alt', t.textAccent, t.surfaceAlt],
    ['muted text on background', t.textMuted, t.background],
    ['muted text on surface', t.textMuted, t.surface],
    // The recessed fill a default badge sits on.
    ['muted text on the sunken surface', t.textMuted, t.surfaceSunken],
    ['body text on background', t.text, t.background],
    ['body text on surface', t.text, t.surface],
    ['inverse text on the inverse surface', t.textInverse, t.surfaceInverse],
    ['on-accent over accent', t.onAccent, t.accent],
    ['on-accent over accent hover', t.onAccent, t.accentHover],
    ['on-danger over danger', t.onDanger, t.danger],
    ['on-danger over danger hover', t.onDanger, t.dangerHover],
    ['on-success over success', t.onSuccess, t.success],
    ['on-warning over warning', t.onWarning, t.warning],
    ['on-info over info', t.onInfo, t.info],
    ['danger text on surface', t.textDanger, t.surface],
    ['danger text on surface-alt', t.textDanger, t.surfaceAlt],
    ['success text on surface', t.textSuccess, t.surface],
    ['warning text on surface', t.textWarning, t.surface],
    ['info text on surface', t.textInfo, t.surface],
  ];

  it.each(textPairs)('meets WCAG AA for small text: %s', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  // WCAG 1.4.11: a form control's boundary is the only thing identifying it, so it needs 3:1.
  // Decorative hairlines (`border`, `border-soft`) are deliberately lighter and exempt.
  const boundaryPairs: Array<[string, string, string]> = [
    ['control border on the input surface', t.borderControl, t.surfaceInput],
    ['control border on background', t.borderControl, t.background],
    ['control border on surface', t.borderControl, t.surface],
    ['control border on surface-alt', t.borderControl, t.surfaceAlt],
    ['focus ring on background', t.focusRing, t.background],
    ['focus ring on surface', t.focusRing, t.surface],
  ];

  it.each(boundaryPairs)('meets WCAG AA for non-text contrast: %s', (_name, fg, bg) => {
    expect(contrast(fg, bg)).toBeGreaterThanOrEqual(3);
  });
});

describe('dark theme', () => {
  it('redefines exactly the semantic roles, no more and no less', () => {
    expect(Object.keys(darkSemantic).sort()).toEqual(Object.keys(semantic).sort());
  });

  it('emits an attribute-scoped block by default', () => {
    const css = generateDarkCss();
    expect(css).toContain("[data-theme='dark']");
    expect(css).toContain('color-scheme: dark');
    expect(css).toContain('--loidolt-surface: #1e211c');
    expect(css).not.toContain('prefers-color-scheme');
  });

  it('can also follow the system preference without trapping an explicit light choice', () => {
    const css = generateDarkCss('auto');
    expect(css).toContain('@media (prefers-color-scheme: dark)');
    expect(css).toContain(":root:not([data-theme='light'])");
  });

  it('only overrides variables the light theme defines', () => {
    const declared = new Set(flattenTokens().map(([name]) => name));
    for (const name of Object.keys(darkSemantic)) {
      expect(
        declared.has(`--loidolt-${name.replace(/[A-Z]/g, (l) => `-${l.toLowerCase()}`)}`)
      ).toBe(true);
    }
  });
});
