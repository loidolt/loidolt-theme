import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  aspectRatio,
  colors,
  chartColors,
  chartRoles,
  contrastRequirements,
  cssVarName,
  darkSemantic,
  flattenTokens,
  generateCss,
  generateDarkCss,
  getContrastRatio,
  getContrastTextColor,
  getLuminance,
  mapColors,
  resolveRoles,
  roleValue,
  roleVar,
  meetsContrast,
  semantic,
  tokens,
  validateContrast,
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

  it('gives a trailing number its own segment without renaming anything else', () => {
    expect(cssVarName(['chart1'])).toBe('--loidolt-chart-1');
    expect(cssVarName(['chartSequential5'])).toBe('--loidolt-chart-sequential-5');
    expect(css).toContain('--loidolt-color-series-1: #c65224');
    expect(css).toContain('--loidolt-space-10: 2.5rem');
    // A letter glued to a digit would be unreachable from hand-written CSS.
    expect([...declared].filter((name) => /[a-z]\d/.test(name))).toEqual([]);
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
  /** Every stylesheet in the package, as paths relative to `src/` (component files included). */
  const stylesheets = async () =>
    (await readdir(stylesDir, { recursive: true }))
      .filter((file) => file.endsWith('.css'))
      .map((file) => file.split('\\').join('/'))
      .sort();

  it('resolves every var(--loidolt-*) used by @loidolt/theme-styles', async () => {
    const files = await stylesheets();
    // The component styles live one level down; a flat readdir silently skipped all of them.
    expect(files.some((file) => file.startsWith('components'))).toBe(true);

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
    // `tokens.css` is the one file that is meant to name primitives.
    const files = (await stylesheets()).filter((file) => file !== 'tokens.css');
    const primitives = new Map<string, string[]>();
    for (const file of files) {
      const source = await readFile(new URL(file, stylesDir), 'utf8');
      for (const [, name] of source.matchAll(/var\((--loidolt-color-[a-z0-9-]+)/g)) {
        primitives.set(file, [...new Set([...(primitives.get(file) ?? []), name])]);
      }
    }
    expect(Object.fromEntries(primitives)).toEqual({});
  });
});

const contrast = getContrastRatio;

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
      expect(declared.has(cssVarName([name]))).toBe(true);
    }
  });
});

describe('contrast utilities', () => {
  it('measures the extremes and is order-independent', () => {
    expect(getLuminance('#000')).toBe(0);
    expect(getLuminance('#ffffff')).toBe(1);
    expect(getContrastRatio('#000000', '#fff')).toBeCloseTo(21, 5);
    expect(getContrastRatio('#fff', '#000')).toBe(getContrastRatio('#000', '#fff'));
    expect(getContrastRatio('#c65224', '#c65224')).toBe(1);
  });

  it('agrees with a published reference pair', () => {
    // #767676 on white is the classic "just passes AA" grey.
    expect(getContrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 2);
    expect(meetsContrast('#767676', '#ffffff')).toBe(true);
    expect(meetsContrast('#777777', '#ffffff')).toBe(false);
    expect(meetsContrast('#777777', '#ffffff', { size: 'large' })).toBe(true);
    expect(meetsContrast('#767676', '#ffffff', { level: 'AAA' })).toBe(false);
  });

  it('reports every threshold at once', () => {
    expect(validateContrast('#767676', '#ffffff')).toEqual({
      ratio: expect.closeTo(4.54, 2),
      ratioString: '4.54:1',
      passesAANormal: true,
      passesAALarge: true,
      passesAAANormal: false,
      passesAAALarge: true,
    });
    expect(contrastRequirements.AAA.normal).toBe(7);
  });

  it('picks whichever ink measures better, defaulting to the theme inks', () => {
    expect(getContrastTextColor(colors.orange)).toBe('#f5f2e9');
    expect(getContrastTextColor(colors.paper)).toBe(colors.deep);
    expect(getContrastTextColor('#ffff00', { dark: '#000', light: '#fff' })).toBe('#000');
  });

  it('rejects anything that is not a hex colour', () => {
    expect(() => getLuminance('red')).toThrow(RangeError);
    expect(() => getContrastRatio('#12345', '#fff')).toThrow(/getContrastRatio: invalid hex/);
  });
});

describe('aspect ratios', () => {
  it('emits each named frame as a CSS aspect-ratio value', () => {
    expect(aspectRatio.video).toBe('16 / 9');
    expect(css).toContain('--loidolt-aspect-square: 1 / 1;');
    expect(css).toContain('--loidolt-aspect-portrait: 3 / 4;');
  });
});

/** CIE76 distance in Lab — enough to tell whether two series colours read as different. */
function deltaE(a: string, b: string): number {
  const lab = (hex: string) => {
    const channel = (offset: number) => {
      const value = parseInt(hex.slice(offset, offset + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const [r, g, b] = [channel(1), channel(3), channel(5)];
    const xyz = [
      (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047,
      0.2126 * r + 0.7152 * g + 0.0722 * b,
      (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883,
    ].map((v) => (v > 0.008856 ? Math.cbrt(v) : 7.787 * v + 16 / 116));
    return [116 * xyz[1] - 16, 500 * (xyz[0] - xyz[1]), 200 * (xyz[1] - xyz[2])];
  };
  const [x, y] = [lab(a), lab(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
}

describe.each(['light', 'dark'] as const)('data visualisation colours (%s)', (scheme) => {
  const chart = chartColors(scheme);
  const map = mapColors(scheme);
  const surfaces = [chart.background, chart.surface, roleValue('surfaceAlt', scheme)];

  it('holds every series, gain and loss at 3:1 against every surface', () => {
    for (const colour of [...chart.categorical, chart.positive, chart.negative]) {
      for (const surface of surfaces) {
        expect(contrast(colour, surface), `${colour} on ${surface}`).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it('keeps the series visibly apart from one another', () => {
    const { categorical } = chart;
    for (let i = 0; i < categorical.length; i++) {
      for (let j = i + 1; j < categorical.length; j++) {
        expect(deltaE(categorical[i], categorical[j]), `${i + 1} vs ${j + 1}`).toBeGreaterThan(15);
      }
    }
  });

  it('runs the sequential ramp steadily from least to most', () => {
    // "Most" is the step furthest from the surface, so the ramp's contrast only ever grows.
    const steps = chart.sequential.map((colour) => contrast(colour, chart.surface));
    for (let i = 1; i < steps.length; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
    expect(steps.at(-1)).toBeGreaterThanOrEqual(3);
  });

  it('centres the diverging ramp on the step nearest the surface', () => {
    const steps = chart.diverging.map((colour) => contrast(colour, chart.surface));
    const quietest = steps.indexOf(Math.min(...steps));
    expect(quietest).toBe(3);
    expect(steps[0]).toBeGreaterThanOrEqual(3);
    expect(steps[6]).toBeGreaterThanOrEqual(3);
    for (let i = 1; i <= 3; i++) expect(steps[i]).toBeLessThan(steps[i - 1]);
    for (let i = 4; i < 7; i++) expect(steps[i]).toBeGreaterThan(steps[i - 1]);
  });

  it('keeps map labels readable on land and water', () => {
    expect(contrast(map.label, map.land)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(map.label, map.labelHalo)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(map.label, map.water)).toBeGreaterThanOrEqual(3);
    expect(contrast(map.label, map.park)).toBeGreaterThanOrEqual(3);
  });
});

describe('role resolution', () => {
  it('resolves singles and lists, from the reference theme or a live reader', () => {
    expect(roleVar('chart1')).toBe('--loidolt-chart-1');
    expect(roleValue('chart1')).toBe(colors.series[1]);
    expect(roleValue('chart1', 'dark')).toBe(darkSemantic.chart1);
    expect(chartColors().categorical).toHaveLength(8);
    expect(resolveRoles({ ink: 'text', pair: ['accent', 'surface'] }, 'dark')).toEqual({
      ink: darkSemantic.text,
      pair: [darkSemantic.accent, darkSemantic.surface],
    });
    const read = (role: string) => `read:${role}`;
    expect(resolveRoles({ first: chartRoles.categorical }, 'light', read).first[0]).toBe(
      'read:chart1'
    );
  });
});
