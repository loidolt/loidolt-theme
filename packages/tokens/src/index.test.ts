import { readFile, readdir } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  borders,
  colors,
  contrastPairs,
  contrastRatio,
  darkSemantic,
  flattenTokens,
  generateCss,
  generateDarkCss,
  roles,
  semantic,
  spacing,
  tokens,
  typography,
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

  it('emits the shape and voice roles, linked to their primitives', () => {
    expect(css).toContain('--loidolt-radius-control: var(--loidolt-border-radius)');
    expect(css).toContain('--loidolt-pad-surface: var(--loidolt-space-4)');
    expect(css).toContain('--loidolt-label-transform: uppercase');
    expect(roles.radiusSurface).toBe(borders.radius);
    expect(roles.padPage).toBe(spacing[6]);
    expect(roles.labelTracking).toBe(typography.tracking.utility);
  });

  it('keeps every tracking and stroke role in a length unit, since stylesheets calc() on them', () => {
    for (const [name, value] of Object.entries(roles)) {
      if (/^(stroke|.*Tracking)/.test(name)) expect(value, name).toMatch(/^-?[\d.]+(px|em|rem)$/);
    }
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

  // Recursive: the component rules live in `components/*.css`, which a flat listing never saw.
  const stylesheets = async () => {
    const files = (await readdir(stylesDir, { recursive: true })).filter((file) =>
      file.endsWith('.css')
    );
    return Promise.all(
      files.map(async (file) => [file, await readFile(new URL(file, stylesDir), 'utf8')] as const)
    );
  };

  it('scans the component stylesheets, not just the entry points', async () => {
    const files = (await stylesheets()).map(([file]) => file);
    expect(files).toContain('components/actions.css');
    expect(files).toContain('base.css');
  });

  it('resolves every var(--loidolt-*) used by @loidolt/theme-styles', async () => {
    const missing = new Map<string, string[]>();
    for (const [file, source] of await stylesheets()) {
      for (const [, name] of source.matchAll(/var\((--loidolt-[a-z0-9-]+)/g)) {
        if (!declared.has(name)) missing.set(name, [...(missing.get(name) ?? []), file]);
      }
    }
    expect(Object.fromEntries(missing)).toEqual({});
  });

  it('never lets a stylesheet reach past the semantic layer for colour', async () => {
    const offenders = (await stylesheets()).flatMap(([file, source]) =>
      [...source.matchAll(/var\((--loidolt-color-[a-z0-9-]+)/g)].map((m) => `${file}: ${m[1]}`)
    );
    expect(offenders).toEqual([]);
  });

  /*
   * A preset can only move what the stylesheets read from a token. Every property a preset is
   * meant to restyle must therefore be `0`, a keyword, or a `var()` — or carry an
   * `@literal <reason>` comment on the same line saying why that value is geometry rather than
   * style (a spinner's circle, a CSS triangle, a WCAG floor).
   */
  it('reads every preset-driven property from a token', async () => {
    const guarded =
      /^(padding(-[a-z-]+)?|gap|row-gap|column-gap|border(-[a-z-]+)?|outline(-[a-z]+)?|letter-spacing|font-weight|text-transform|box-shadow)$/;
    // Keywords that would smuggle a style decision past the tokens.
    const styleKeywords = new Set(['uppercase', 'lowercase', 'capitalize', 'bold', 'bolder']);
    const topLevelParts = (value: string) => {
      const parts: string[] = [];
      let depth = 0;
      let current = '';
      for (const char of value) {
        if (char === '(') depth += 1;
        if (char === ')') depth -= 1;
        if (depth === 0 && /[\s,]/.test(char)) {
          if (current) parts.push(current);
          current = '';
        } else current += char;
      }
      if (current) parts.push(current);
      return parts;
    };
    const tokenized = (part: string) =>
      part === '0' ||
      part.includes('var(--loidolt-') ||
      part.includes('var(--ldt-') ||
      (/^[a-zA-Z-]+$/.test(part) && !styleKeywords.has(part));

    const offenders: string[] = [];
    for (const [file, source] of await stylesheets()) {
      // `@font-face` descriptors describe a font file, not a style choice.
      if (file === 'fonts.css') continue;
      source.split('\n').forEach((line, index) => {
        const declaration = /^\s*([a-z-]+)\s*:\s*([^;]+);/.exec(line);
        if (!declaration || !guarded.test(declaration[1]) || line.includes('@literal')) return;
        const value = declaration[2].replace('!important', '');
        if (!topLevelParts(value).every(tokenized))
          offenders.push(`${file}:${index + 1} ${line.trim()}`);
      });
    }
    expect(offenders).toEqual([]);
  });
});

describe('generated stylesheets', () => {
  // Pins the emitted CSS byte for byte, so a refactor of the generator cannot shift the default
  // look unnoticed. An intended change updates the snapshot with `vitest -u` and gets reviewed.
  it('keeps tokens.css stable', async () => {
    await expect(generateCss()).toMatchFileSnapshot('./__snapshots__/tokens.css');
  });

  it('keeps dark.css stable', async () => {
    await expect(generateDarkCss('attribute')).toMatchFileSnapshot('./__snapshots__/dark.css');
  });

  it('keeps dark-auto.css stable', async () => {
    await expect(generateDarkCss('auto')).toMatchFileSnapshot('./__snapshots__/dark-auto.css');
  });
});

describe.each([
  ['light', semantic],
  ['dark', darkSemantic],
])('colour contrast (%s)', (_theme, t) => {
  it.each(contrastPairs(t))('meets WCAG AA: %s', (_name, foreground, background, required) => {
    expect(contrastRatio(foreground, background)).toBeGreaterThanOrEqual(required);
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
