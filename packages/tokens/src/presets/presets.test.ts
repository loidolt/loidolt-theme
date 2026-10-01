import { access } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import {
  auditContrast,
  builtInPresets,
  compact,
  darkSemantic,
  definePreset,
  flattenTokens,
  generatePresetCss,
  loidolt,
  presetStylesheets,
  roles,
  semantic,
  soft,
} from '../index.js';

const declared = new Set(flattenTokens().map(([name]) => name));

describe.each(
  builtInPresets.flatMap((preset) => [
    [preset.name, 'light', preset] as const,
    [preset.name, 'dark', preset] as const,
  ])
)('%s preset, %s scheme', (_name, scheme, preset) => {
  it.each(auditContrast(preset.resolved[scheme]).map((check) => [check.name, check] as const))(
    'meets WCAG AA: %s',
    (_pair, check) => {
      expect(check.ratio, `${check.foreground} on ${check.background}`).toBeGreaterThanOrEqual(
        check.required
      );
    }
  );
});

describe.each(builtInPresets.map((preset) => [preset.name, preset] as const))(
  '%s preset stylesheets',
  (_name, preset) => {
    const files = Object.values(presetStylesheets(preset));

    it('declares only custom properties the base system defines', () => {
      for (const css of files) {
        for (const [, name] of css.matchAll(/^\s*(--[a-z0-9-]+):/gm)) {
          expect(declared.has(name), `${name} is not a base token`).toBe(true);
        }
      }
    });

    it('references only declared tokens', () => {
      for (const css of files) {
        for (const [, name] of css.matchAll(/var\((--loidolt-[a-z0-9-]+)\)/g)) {
          expect(declared.has(name), `dangling ${name}`).toBe(true);
        }
      }
    });

    it('restates every colour role in both schemes', () => {
      expect(Object.keys(preset.resolved.light).sort()).toEqual(Object.keys(semantic).sort());
      expect(Object.keys(preset.resolved.dark).sort()).toEqual(Object.keys(darkSemantic).sort());
    });
  }
);

describe('built-in presets', () => {
  it('ships a stylesheet forwarder in @loidolt/theme-styles for every block', async () => {
    const stylesDir = new URL('../../../styles/src/presets/', import.meta.url);
    for (const preset of builtInPresets) {
      for (const suffix of ['', '-dark', '-dark-auto']) {
        await expect(
          access(new URL(`${preset.name}${suffix}.css`, stylesDir))
        ).resolves.toBeUndefined();
      }
    }
  });

  it('keeps loidolt identical to the base system', () => {
    expect(loidolt.resolved.roles).toEqual(roles);
    expect(loidolt.resolved.light).toEqual(semantic);
    expect(loidolt.resolved.dark).toEqual(darkSemantic);
  });

  it('scales every density role compact does not set, references included', () => {
    expect(compact.resolved.roles.padControlX).toBe('0.6375rem');
    expect(compact.resolved.roles.padField).toBe('0.3375rem 0.1125rem');
    // `pad-surface` links to `space-4` (1rem) in the base system.
    expect(compact.resolved.roles.padSurface).toBe('0.75rem');
    expect(compact.resolved.roles.radiusControl).toBe('0px');
  });

  it('rounds soft and drops the uppercase voice', () => {
    expect(soft.resolved.roles.radiusControl).toBe('6px');
    expect(soft.resolved.roles.labelTransform).toBe('none');
    expect(soft.resolved.roles.controlTracking).toBe('0em');
  });
});

describe('generatePresetCss', () => {
  const css = (scope: 'attribute' | 'root', scheme: 'light' | 'dark' | 'dark-auto') =>
    generatePresetCss(soft, { scope, scheme });

  it('scopes shape and light colours to the preset attribute', () => {
    expect(css('attribute', 'light')).toContain(
      "[data-preset='soft'] {\n  --loidolt-font-display:"
    );
    expect(css('attribute', 'light')).toContain(
      "[data-preset='soft']:not([data-theme='dark'], [data-theme='dark'] *) {\n  --loidolt-background: #f4f6f8;"
    );
  });

  it('applies dark colours to the preset root and to presets inside a dark scheme', () => {
    expect(css('attribute', 'dark')).toContain(
      "[data-preset='soft'][data-theme='dark'],\n[data-theme='dark'] [data-preset='soft'] {\n  color-scheme: dark;"
    );
    expect(css('attribute', 'dark')).not.toContain('prefers-color-scheme');
  });

  it('follows the system scheme unless light is chosen explicitly', () => {
    expect(css('attribute', 'dark-auto')).toContain('@media (prefers-color-scheme: dark) {');
    expect(css('attribute', 'dark-auto')).toContain(
      "[data-preset='soft']:root:not([data-theme='light']),\n  :root:not([data-theme='light']) [data-preset='soft']:not([data-theme='light'], [data-theme='light'] *) {"
    );
  });

  it('can apply to :root for single-preset apps', () => {
    expect(css('root', 'light')).toContain(':root {\n');
    expect(css('root', 'light')).toContain(":root:not([data-theme='dark']) {");
    expect(css('root', 'dark')).toContain(":root[data-theme='dark'] {");
    expect(css('root', 'dark-auto')).toContain(":root:root:not([data-theme='light']) {");
    expect(css('root', 'light')).not.toContain('data-preset');
  });

  it('puts font imports ahead of everything else', () => {
    const preset = definePreset({ name: 'fonts', fontImport: 'https://fonts.example/a.css' });
    expect(generatePresetCss(preset)).toMatch(
      /^@import url\("https:\/\/fonts\.example\/a\.css"\);\n/
    );
    expect(generatePresetCss(preset, { scheme: 'dark' })).not.toContain('@import');
  });

  it('names the six files a preset ships', () => {
    expect(Object.keys(presetStylesheets(compact)).sort()).toEqual([
      'compact-dark-auto.css',
      'compact-dark.css',
      'compact.css',
      'compact.root-dark-auto.css',
      'compact.root-dark.css',
      'compact.root.css',
    ]);
  });
});

describe('definePreset', () => {
  it('builds on another preset with extends', () => {
    const softCompact = definePreset({ name: 'soft-compact', extends: soft, density: 0.8 });
    expect(softCompact.resolved.roles.radiusControl).toBe('6px');
    expect(softCompact.resolved.light.accent).toBe(soft.resolved.light.accent);
    expect(softCompact.resolved.roles.padControlX).toBe(
      `${Number((parseFloat(soft.resolved.roles.padControlX) * 0.8).toFixed(4))}rem`
    );
  });

  it('leaves explicitly set density roles alone', () => {
    const preset = definePreset({ name: 'mixed', density: 0.5, roles: { padCell: '2rem' } });
    expect(preset.resolved.roles.padCell).toBe('2rem');
    expect(preset.resolved.roles.padCallout).toBe('0.4rem 0.5rem');
  });

  it('gives a bare zero a unit where stylesheets calc() on it', () => {
    const preset = definePreset({ name: 'flat', roles: { labelTracking: '0', strokeAccent: '0' } });
    expect(preset.resolved.roles.labelTracking).toBe('0em');
    expect(preset.resolved.roles.strokeAccent).toBe('0px');
  });

  it('follows a changed primitive through every role that links to it', () => {
    const preset = definePreset({ name: 'round', primitives: { borders: { radius: '12px' } } });
    expect(preset.resolved.roles.radiusSurface).toBe('12px');
    expect(preset.declarations.shape).toContainEqual([
      '--loidolt-radius-surface',
      'var(--loidolt-border-radius)',
    ]);
  });

  it('rejects what it cannot emit safely', () => {
    expect(() => definePreset({ name: 'Bad Name' })).toThrow(/lowercase/);
    expect(() => definePreset({ name: 'x', density: 2 })).toThrow(/density/);
    expect(() => definePreset({ name: 'x', roles: { strokeFocus: '1px' } })).toThrow(/2px/);
    // @ts-expect-error unknown role
    expect(() => definePreset({ name: 'x', roles: { radiusButton: '4px' } })).toThrow(
      /Unknown role/
    );
    expect(() =>
      // @ts-expect-error dark must restate every role light changes
      definePreset({ name: 'x', colors: { light: { accent: '#000000' }, dark: {} } })
    ).toThrow(/for light but not for dark/);
    expect(() =>
      definePreset({
        name: 'x',
        // @ts-expect-error unknown colour role
        colors: { light: { acent: '#000000' }, dark: { acent: '#000000' } },
      })
    ).toThrow(/Unknown colour role/);
    expect(() =>
      // @ts-expect-error colour primitives are not overridable
      definePreset({ name: 'x', primitives: { colors: { orange: '#000000' } } })
    ).toThrow(/Unknown primitive group/);
  });
});
