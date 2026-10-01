import type { ColorRoles } from '../contrast.js';
import {
  borders,
  cssVarName,
  darkSemantic,
  flattenInto,
  flattenTokens,
  isRef,
  motion,
  roleDefs,
  semanticDefs,
  shadows,
  sizing,
  spacing,
  typography,
  type TokenRef,
  type TokenTree,
} from '../tokens.js';

/** A colour role: `surface`, `textMuted`, `onAccent`, … */
export type ColorRole = keyof typeof semanticDefs;
/** A shape or voice role: `radiusControl`, `padCell`, `labelTransform`, … */
export type Role = keyof typeof roleDefs;

type Overrides<T> = { readonly [K in keyof T]?: T[K] extends string ? string : Overrides<T[K]> };

/**
 * The primitive scales a preset may move. Colour primitives are deliberately absent: colour is
 * restyled through the colour *roles*, which is also the only way it survives subtree scoping
 * (a `var()` resolves where it is declared, so a role declared on `:root` would never see a
 * primitive overridden further down).
 */
export interface PresetPrimitives {
  readonly typography?: Overrides<typeof typography>;
  readonly spacing?: Overrides<typeof spacing>;
  readonly sizing?: Overrides<typeof sizing>;
  readonly borders?: Overrides<typeof borders>;
  readonly shadows?: Overrides<typeof shadows>;
  readonly motion?: Overrides<typeof motion>;
}

export type ColorOverrides = { readonly [K in ColorRole]?: string };

export interface PresetDefinition<Light extends ColorOverrides = ColorOverrides> {
  /** Lowercase identifier, used in `data-preset="…"` and file names. */
  name: string;
  /** Human-readable name for pickers. Defaults to the capitalised `name`. */
  label?: string;
  description?: string;
  /** Start from another preset instead of the base system, then apply this definition on top. */
  extends?: Preset;
  primitives?: PresetPrimitives;
  roles?: { readonly [K in Role]?: string };
  /**
   * One knob for every padding and gap role (`pad-*`, `gap-*`) this definition does not set
   * itself: `0.75` is a quarter tighter, `1.2` a fifth roomier. Between 0.5 and 1.5.
   */
  density?: number;
  /**
   * Colour roles for each scheme. `dark` must restate every role `light` changes — a light-only
   * override would leave the dark scheme pairing the new colour with the old one.
   */
  colors?: {
    light: Light;
    dark: { readonly [K in keyof Light]-?: string } & ColorOverrides;
  };
  /** Stylesheet URLs `@import`ed ahead of the preset, typically webfonts the preset names. */
  fontImport?: string | readonly string[];
}

export interface Preset {
  readonly name: string;
  readonly label: string;
  readonly description: string | undefined;
  readonly fontImports: readonly string[];
  /** Custom property declarations per block, values as they are written to CSS. */
  readonly declarations: {
    /** Primitives and shape/voice roles — scheme-independent. */
    readonly shape: ReadonlyArray<readonly [name: string, value: string]>;
    readonly light: ReadonlyArray<readonly [name: string, value: string]>;
    readonly dark: ReadonlyArray<readonly [name: string, value: string]>;
  };
  /** Every role with its references followed to a concrete value, for JS consumers and tests. */
  readonly resolved: {
    readonly roles: { readonly [K in Role]: string };
    readonly light: ColorRoles;
    readonly dark: ColorRoles;
  };
}

type Value = string | TokenRef;

interface State {
  /** Overridable primitives, by custom property name. */
  primitives: Map<string, string>;
  roles: Record<Role, Value>;
  light: Record<ColorRole, Value>;
  dark: Record<ColorRole, string>;
}

const PRIMITIVE_GROUPS = { typography, spacing, sizing, borders, shadows, motion } as const;
const PRIMITIVE_PREFIX: Record<keyof PresetPrimitives, string> = {
  typography: 'font',
  spacing: 'space',
  sizing: 'size',
  borders: 'border',
  shadows: 'shadow',
  motion: 'motion',
};

const flatten = (prefix: string, tree: TokenTree) => {
  const out: Array<[string, Value]> = [];
  flattenInto([prefix], tree, out);
  return out as Array<[string, string]>;
};

const baseState = (): State => ({
  primitives: new Map(
    (Object.keys(PRIMITIVE_GROUPS) as Array<keyof PresetPrimitives>).flatMap((group) =>
      flatten(PRIMITIVE_PREFIX[group], PRIMITIVE_GROUPS[group])
    )
  ),
  roles: { ...roleDefs },
  light: { ...semanticDefs },
  dark: { ...darkSemantic },
});

/** Internal state behind each preset, so `extends` can build on it. */
const states = new WeakMap<Preset, State>();

const NAME = /^[a-z][a-z0-9-]*$/;
const DENSITY_ROLE = /^(pad|gap)[A-Z]/;
const LENGTH = /(-?\d*\.?\d+)(rem|px|em)\b/g;

const round = (value: number) => String(Number(value.toFixed(4)));
const scaleLengths = (value: string, factor: number) =>
  value.replace(
    LENGTH,
    (_, amount: string, unit: string) => `${round(parseFloat(amount) * factor)}${unit}`
  );

// The same naming as the base stylesheet, so `chart1` lands on `--loidolt-chart-1`.
const roleName = (name: string) => cssVarName([name]);
const cssValue = (value: Value) => (isRef(value) ? `var(${value.$ref})` : value);

const defaultValues = new Map(flattenTokens());

/** Follows `ref()` links through the state, then the base token set, to a written value. */
const resolveIn = (state: State) => {
  const lookup = (name: string): Value | undefined =>
    state.primitives.get(name) ?? defaultValues.get(name);
  const resolve = (value: Value, seen = new Set<string>()): string => {
    if (!isRef(value)) return value;
    if (seen.has(value.$ref)) throw new Error(`Circular token reference through ${value.$ref}`);
    const target = lookup(value.$ref);
    if (target === undefined) throw new Error(`Unknown token reference ${value.$ref}`);
    return resolve(target, new Set([...seen, value.$ref]));
  };
  return resolve;
};

const assertKnownKeys = (what: string, given: object | undefined, known: object) => {
  for (const key of Object.keys(given ?? {})) {
    if (!(key in known)) throw new Error(`Unknown ${what} "${key}"`);
  }
};

/**
 * Defines a named style set: colours for both schemes plus the shape and voice of every
 * component, compiled to a stylesheet by {@link generatePresetCss}.
 *
 * ```ts
 * export const studio = definePreset({
 *   name: 'studio',
 *   roles: { radiusControl: '4px', labelTransform: 'none' },
 *   colors: {
 *     light: { accent: '#0b6bcb', accentHover: '#0956a3' },
 *     dark: { accent: '#5aa7f0', accentHover: '#7ab8f3' },
 *   },
 * });
 * ```
 *
 * Every preset is complete: whatever it does not set comes from the base system (or from the
 * preset it `extends`), so nesting one preset inside another restyles the subtree fully rather
 * than blending the two.
 */
export function definePreset<
  const Light extends ColorOverrides & {
    readonly [K in Exclude<keyof Light, ColorRole>]: never;
  } = Record<never, never>,
>(definition: PresetDefinition<Light>): Preset {
  const { name, primitives = {}, roles = {}, density, colors, fontImport } = definition;

  if (!NAME.test(name)) {
    throw new Error(`Preset name "${name}" must be lowercase letters, digits and dashes`);
  }
  assertKnownKeys('primitive group', primitives, PRIMITIVE_GROUPS);
  assertKnownKeys('role', roles, roleDefs);
  assertKnownKeys('colour role', colors?.light, semanticDefs);
  assertKnownKeys('colour role', colors?.dark, semanticDefs);
  if (colors) {
    const missing = Object.keys(colors.light).filter((key) => !(key in colors.dark));
    if (missing.length) {
      throw new Error(`Preset "${name}" sets ${missing.join(', ')} for light but not for dark`);
    }
  }
  if (density !== undefined && !(density >= 0.5 && density <= 1.5)) {
    throw new Error(`Preset "${name}" density must be between 0.5 and 1.5, got ${density}`);
  }

  const parent = definition.extends ? states.get(definition.extends) : baseState();
  if (!parent) throw new Error(`Preset "${name}" extends something that is not a preset`);
  const state: State = {
    primitives: new Map(parent.primitives),
    roles: { ...parent.roles },
    light: { ...parent.light, ...colors?.light },
    dark: { ...parent.dark, ...colors?.dark },
  };

  for (const [group, overrides] of Object.entries(primitives) as Array<
    [keyof PresetPrimitives, TokenTree]
  >) {
    for (const [property, value] of flatten(PRIMITIVE_PREFIX[group], overrides)) {
      if (!state.primitives.has(property)) throw new Error(`Unknown primitive ${property}`);
      state.primitives.set(property, value);
    }
  }

  const resolve = resolveIn(state);
  for (const role of Object.keys(state.roles) as Role[]) {
    const explicit = roles[role];
    if (explicit !== undefined) state.roles[role] = explicit;
    else if (density !== undefined && density !== 1 && DENSITY_ROLE.test(role)) {
      state.roles[role] = scaleLengths(resolve(state.roles[role]), density);
    }
  }

  // Tracking and stroke roles are multiplied in `calc()`, where a bare `0` is a number, not a
  // length, and would invalidate the whole declaration.
  for (const role of Object.keys(state.roles) as Role[]) {
    const value = state.roles[role];
    if (value === '0' && role.startsWith('stroke')) state.roles[role] = '0px';
    if (value === '0' && role.endsWith('Tracking')) state.roles[role] = '0em';
  }

  const focus = /^([\d.]+)px$/.exec(resolve(state.roles.strokeFocus));
  if (focus && parseFloat(focus[1]) < 2) {
    throw new Error(`Preset "${name}" focus ring must stay at least 2px wide (WCAG 2.4.13)`);
  }

  const resolveAll = <K extends string>(record: Record<K, Value>) =>
    Object.fromEntries(
      Object.entries<Value>(record).map(([key, value]) => [key, resolve(value)])
    ) as Record<K, string>;

  const preset: Preset = {
    name,
    label: definition.label ?? name.charAt(0).toUpperCase() + name.slice(1),
    description: definition.description,
    fontImports: [fontImport ?? []].flat(),
    declarations: {
      shape: [
        ...state.primitives,
        ...Object.entries<Value>(state.roles).map(
          ([role, value]) => [roleName(role), cssValue(value)] as const
        ),
      ],
      light: Object.entries<Value>(state.light).map(
        ([role, value]) => [roleName(role), cssValue(value)] as const
      ),
      dark: Object.entries(state.dark).map(([role, value]) => [roleName(role), value] as const),
    },
    resolved: {
      roles: resolveAll(state.roles),
      light: resolveAll(state.light),
      dark: resolveAll(state.dark),
    },
  };
  states.set(preset, state);
  return preset;
}

export interface PresetCssOptions {
  /**
   * - `attribute` (default): applies under `[data-preset="<name>"]`, on `<html>` or any subtree,
   *   so several presets can ship side by side and switch at runtime.
   * - `root`: applies to `:root` outright, for an app that only ever uses this one preset.
   */
  scope?: 'attribute' | 'root';
  /**
   * Which block to emit, mirroring the base `tokens` / `dark` / `dark-auto` trio:
   * - `light` (default): shape, voice and the light colours, plus any `fontImport`.
   * - `dark`: the dark colours under `data-theme="dark"`.
   * - `dark-auto`: the same, plus a `prefers-color-scheme` rule an explicit light choice overrides.
   */
  scheme?: 'light' | 'dark' | 'dark-auto';
}

const block = (selector: string, lines: readonly string[], indent = '') => [
  `${indent}${selector} {`,
  ...lines.map((line) => `${indent}  ${line}`),
  `${indent}}`,
];

const declare = (entries: ReadonlyArray<readonly [string, string]>) =>
  entries.map(([name, value]) => `${name}: ${value};`);

/*
 * Selector plan. Presets are unlayered, like the base dark theme, so they beat the layered
 * defaults outright; specificity then orders them against the base dark theme (0,1,0) and
 * dark-auto (0,2,0) regardless of import order:
 *
 *   shape   P                                           (0,1,0)  never conflicts: base dark sets colour only
 *   light   P:not([data-theme=dark], [data-theme=dark] *)  (0,2,0)  steps aside in dark, so a missing
 *                                                               preset dark file falls back to the base one
 *   dark    P[data-theme=dark], [data-theme=dark] P     (0,2,0)
 *   auto    P:root:not(…light…), :root:not(…light…) P:not(…light…)  (0,3,0)+  beats light in a dark system
 */
const selectors = (name: string, scope: 'attribute' | 'root') => {
  if (scope === 'root') {
    return {
      shape: ':root',
      light: ":root:not([data-theme='dark'])",
      dark: ":root[data-theme='dark']",
      auto: ":root:root:not([data-theme='light'])",
    };
  }
  const p = `[data-preset='${name}']`;
  return {
    shape: p,
    light: `${p}:not([data-theme='dark'], [data-theme='dark'] *)`,
    dark: `${p}[data-theme='dark'],\n[data-theme='dark'] ${p}`,
    auto: `${p}:root:not([data-theme='light']),\n:root:not([data-theme='light']) ${p}:not([data-theme='light'], [data-theme='light'] *)`,
  };
};

const comment = (text: string) => text.replaceAll('*/', '* /');

/** Serializes one block of a preset to CSS. See {@link presetStylesheets} for the full set. */
export function generatePresetCss(preset: Preset, options: PresetCssOptions = {}): string {
  const { scope = 'attribute', scheme = 'light' } = options;
  const select = selectors(preset.name, scope);
  const header = [
    `/* ${comment(`${preset.label} preset${preset.description ? ` — ${preset.description}` : ''}`)}`,
    '   Generated by definePreset(). Do not edit directly. */',
  ];

  if (scheme === 'light') {
    return `${[
      ...preset.fontImports.map((url) => `@import url(${JSON.stringify(url)});`),
      ...header,
      ...block(select.shape, declare(preset.declarations.shape)),
      ...block(select.light, declare(preset.declarations.light)),
    ].join('\n')}\n`;
  }

  const dark = ['color-scheme: dark;', ...declare(preset.declarations.dark)];
  const lines = [...header, ...block(select.dark, dark)];
  if (scheme === 'dark-auto') {
    lines.push(
      '',
      '@media (prefers-color-scheme: dark) {',
      ...block(select.auto.replaceAll('\n', '\n  '), dark, '  '),
      '}'
    );
  }
  return `${lines.join('\n')}\n`;
}

/**
 * Every stylesheet a preset ships, keyed by file name: `<name>.css`, `<name>-dark.css` and
 * `<name>-dark-auto.css` scoped to `data-preset`, and the same three with `.root` for a
 * single-preset app. Write them from a build script to ship your own preset the way the
 * built-in ones are shipped.
 */
export function presetStylesheets(preset: Preset): Record<string, string> {
  const files: Record<string, string> = {};
  for (const scope of ['attribute', 'root'] as const) {
    const base = scope === 'root' ? `${preset.name}.root` : preset.name;
    files[`${base}.css`] = generatePresetCss(preset, { scope, scheme: 'light' });
    files[`${base}-dark.css`] = generatePresetCss(preset, { scope, scheme: 'dark' });
    files[`${base}-dark-auto.css`] = generatePresetCss(preset, { scope, scheme: 'dark-auto' });
  }
  return files;
}
