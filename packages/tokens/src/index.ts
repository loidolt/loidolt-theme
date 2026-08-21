/**
 * Design tokens for Loidolt applications.
 *
 * Two tiers:
 * - **Primitives** (`--loidolt-color-*`, `--loidolt-space-*`, …) are the raw palette and scales.
 * - **Semantic** (`--loidolt-surface`, `--loidolt-text`, …) name a *role*. Stylesheets and
 *   components consume only these, so a consumer can restyle the system — or add a dark
 *   mode — by redefining the semantic tier alone.
 */

/** A token whose value points at another token, emitted as `var(--loidolt-…)`. */
export type TokenRef = { readonly $ref: string };

const ref = (name: string): TokenRef => ({ $ref: `--loidolt-${name}` });

const isRef = (value: unknown): value is TokenRef =>
  typeof value === 'object' && value !== null && '$ref' in value;

const kebab = (value: string) => value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);

/** `['font', 'lineHeight', 'tight']` → `--loidolt-font-line-height-tight`. */
export const cssVarName = (path: readonly string[]) => `--loidolt-${kebab(path.join('-'))}`;

export const colors = {
  paper: '#ebe7dc',
  panel: '#f5f2e9',
  panelAlt: '#efebe1',
  canvas: '#d8d3c7',
  canvasLine: '#c9c3b6',
  deep: '#20231d',
  muted: '#5f5b50',
  line: '#c8c1b1',
  lineSoft: '#ddd7c9',
  // Darker rule reserved for form-control boundaries, which must clear WCAG 1.4.11 (3:1)
  // because the border is the only thing identifying the control.
  lineStrong: '#847d6a',
  white: '#ffffff',
  orange: '#c65224',
  orangeDark: '#a9441d',
  error: '#9b2822',
  errorDark: '#7f1f1a',
  success: '#3f5139',
  warning: '#7c4d17',
  info: '#265162',
} as const;

export const typography = {
  display: '"Jost", "Avenir Next", sans-serif',
  utility: '"Archivo", "Helvetica Neue", sans-serif',
  mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  size: {
    xs: '0.6875rem',
    sm: '0.75rem',
    base: '0.875rem',
    md: '1rem',
    lg: '1.25rem',
    xl: '1.75rem',
    display: '2.5rem',
  },
  tracking: { utility: '0.1em', wide: '0.13em' },
  lineHeight: { tight: '1.15', normal: '1.45', relaxed: '1.65' },
} as const;

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
} as const;

export const sizing = {
  controlSm: '2rem',
  control: '2.375rem',
  controlLg: '2.75rem',
  topbar: '3.875rem',
  contextbar: '2.5625rem',
  sidebar: '17rem',
  inspector: '18rem',
  content: '75rem',
} as const;

/*
 * The system is square by design: `radius` is 0 and every control keeps a hard corner. `radiusPill`
 * is the deliberate exception, reserved for badges — the one element that must not read as
 * pressable, and reads that way precisely because nothing else is round.
 */
export const borders = { width: '1px', radius: '0px', radiusPill: '999px' } as const;

export const shadows = {
  popover: '0 12px 30px color-mix(in srgb, var(--loidolt-shadow-color) 18%, transparent)',
  modal: '0 24px 60px color-mix(in srgb, var(--loidolt-shadow-color) 24%, transparent)',
  artwork: '0 18px 23px color-mix(in srgb, var(--loidolt-shadow-color) 14%, transparent)',
} as const;

export const motion = {
  fast: '100ms',
  normal: '150ms',
  slow: '220ms',
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
} as const;

export const zIndex = {
  base: '0',
  raised: '10',
  sticky: '40',
  overlay: '60',
  dialog: '61',
  menu: '70',
  toast: '80',
  tooltip: '90',
  skipLink: '1000',
} as const;

/**
 * Breakpoints are not custom properties (`@media` cannot read `var()`), but stay tokenized here
 * so an app and the library agree on where the layout changes.
 *
 * - `compact` — the phone/narrow-tablet break. The only one the package's own CSS uses: below
 *   it the workspace grid collapses to a single column and the sidebar becomes a stacked block.
 * - `expanded` — where a sidebar plus content plus inspector all fit at once.
 * - `wide` — where content stops growing and gutters take the extra room.
 */
export const breakpoints = { compact: '760px', expanded: '1024px', wide: '1400px' } as const;

/**
 * The role layer. Every value links to a primitive, so overriding a primitive propagates and
 * overriding a role restyles every component that plays it.
 */
const semanticDefs = {
  background: ref('color-paper'),
  surface: ref('color-panel'),
  surfaceAlt: ref('color-panel-alt'),
  surfaceSunken: ref('color-canvas'),
  surfaceInverse: ref('color-deep'),
  surfaceInput: ref('color-white'),
  text: ref('color-deep'),
  textMuted: ref('color-muted'),
  textInverse: ref('color-panel'),
  textAccent: ref('color-orange-dark'),
  border: ref('color-line'),
  borderSoft: ref('color-line-soft'),
  borderStrong: ref('color-deep'),
  /** Boundary of an input, select, textarea or switch — held to 3:1 against its surface. */
  borderControl: ref('color-line-strong'),
  /** Decorative rule on the sunken surface (canvas grids, artboard guides). Not a boundary. */
  borderSunken: ref('color-canvas-line'),
  accent: ref('color-orange'),
  accentHover: ref('color-orange-dark'),
  onAccent: ref('color-white'),
  /*
   * Status roles come in pairs. `danger`/`onDanger` are a *fill* and the ink that sits on it;
   * `textDanger` is the same status used as text directly on a surface. They cannot be one
   * value: a fill tuned for white ink is too light to read as text, and vice versa.
   */
  danger: ref('color-error'),
  dangerHover: ref('color-error-dark'),
  onDanger: ref('color-white'),
  textDanger: ref('color-error'),
  success: ref('color-success'),
  onSuccess: ref('color-white'),
  textSuccess: ref('color-success'),
  warning: ref('color-warning'),
  onWarning: ref('color-white'),
  textWarning: ref('color-warning'),
  info: ref('color-info'),
  onInfo: ref('color-white'),
  textInfo: ref('color-info'),
  focusRing: ref('color-orange'),
  shadowColor: ref('color-deep'),
  scrim: 'color-mix(in srgb, var(--loidolt-shadow-color) 72%, transparent)',
} as const satisfies Record<string, string | TokenRef>;

type TokenTree = { readonly [key: string]: string | TokenRef | TokenTree };

const PRIMITIVE_GROUPS: ReadonlyArray<readonly [string, TokenTree]> = [
  ['color', colors],
  ['font', typography],
  ['space', spacing],
  ['size', sizing],
  ['border', borders],
  ['shadow', shadows],
  ['motion', motion],
  ['z', zIndex],
];

const flattenInto = (
  prefix: readonly string[],
  tree: TokenTree,
  out: Array<[string, string | TokenRef]>
) => {
  for (const [key, value] of Object.entries(tree)) {
    if (typeof value === 'string' || isRef(value)) out.push([cssVarName([...prefix, key]), value]);
    else flattenInto([...prefix, key], value, out);
  }
};

/** Every custom property the package emits, in declaration order. */
export function flattenTokens(): Array<[string, string | TokenRef]> {
  const out: Array<[string, string | TokenRef]> = [];
  for (const [prefix, tree] of PRIMITIVE_GROUPS) flattenInto([prefix], tree, out);
  for (const [name, value] of Object.entries(semanticDefs)) out.push([cssVarName([name]), value]);
  return out;
}

/** Serializes the token set to CSS. The build writes this to `dist/tokens.css`. */
export function generateCss(): string {
  const declarations = flattenTokens().map(
    ([name, value]) => `  ${name}: ${isRef(value) ? `var(${value.$ref})` : value};`
  );
  return [
    '/* Generated from src/index.ts. Do not edit directly. */',
    ':root {',
    ...declarations,
    '}',
    '',
  ].join('\n');
}

const resolved = new Map(
  flattenTokens().filter((entry): entry is [string, string] => typeof entry[1] === 'string')
);

/** Semantic roles with their refs resolved to concrete values, for TS/JS consumers. */
export const semantic = Object.fromEntries(
  Object.entries(semanticDefs).map(([name, value]) => [
    name,
    isRef(value) ? (resolved.get(value.$ref) ?? '') : value,
  ])
) as { readonly [K in keyof typeof semanticDefs]: string };

/**
 * Reference dark theme. Only the semantic tier is redefined — the primitives stay put — which
 * is the same move a consumer makes for their own theme. Values are literal rather than linked
 * because a dark surface set is not a re-mapping of the light palette.
 *
 * Every text pair here is asserted at WCAG AA in the token test suite, including the `on-*`
 * inks: lightened status colours need *dark* ink, and pairing them with white is the single
 * easiest mistake to make when hand-rolling a dark theme.
 */
export const darkSemantic = {
  background: '#161814',
  surface: '#1e211c',
  surfaceAlt: '#24271f',
  surfaceSunken: '#101210',
  surfaceInverse: '#ebe7dc',
  surfaceInput: '#24271f',
  text: '#ebe7dc',
  textMuted: '#a8a394',
  textInverse: '#161814',
  textAccent: '#f0895c',
  border: '#3a3d34',
  borderSoft: '#2b2e26',
  borderStrong: '#6a6e5f',
  borderControl: '#787c6b',
  borderSunken: '#262922',
  accent: '#e0672f',
  accentHover: '#f0895c',
  onAccent: '#161814',
  danger: '#d75f55',
  dangerHover: '#e07a70',
  onDanger: '#161814',
  textDanger: '#e88b81',
  success: '#7fa074',
  onSuccess: '#161814',
  textSuccess: '#93b287',
  warning: '#cc9a4e',
  onWarning: '#161814',
  textWarning: '#d9ab63',
  info: '#6ea5bd',
  onInfo: '#161814',
  textInfo: '#85b6ca',
  focusRing: '#f0895c',
  shadowColor: '#000000',
  scrim: 'color-mix(in srgb, var(--loidolt-shadow-color) 78%, transparent)',
} as const satisfies Record<keyof typeof semanticDefs, string>;

const darkDeclarations = () =>
  Object.entries(darkSemantic).map(([name, value]) => `  ${cssVarName([name])}: ${value};`);

/**
 * Dark theme CSS. `scope` picks how it activates:
 * - `attribute` (default): `[data-theme='dark']` only — the app drives it.
 * - `auto`: the same block, plus a `prefers-color-scheme` rule that an explicit
 *   `data-theme="light"` can still override.
 */
export function generateDarkCss(scope: 'attribute' | 'auto' = 'attribute'): string {
  const body = ['  color-scheme: dark;', ...darkDeclarations()];
  const lines = [
    '/* Generated from src/index.ts. Do not edit directly. */',
    "[data-theme='dark'] {",
    ...body,
    '}',
  ];
  if (scope === 'auto') {
    lines.push(
      '',
      '@media (prefers-color-scheme: dark) {',
      "  :root:not([data-theme='light']) {",
      ...body.map((line) => `  ${line}`),
      '  }',
      '}'
    );
  }
  return `${lines.join('\n')}\n`;
}

export const tokens = {
  colors,
  typography,
  spacing,
  sizing,
  borders,
  shadows,
  motion,
  zIndex,
  breakpoints,
  semantic,
  darkSemantic,
} as const;
export type ThemeTokens = typeof tokens;

export default tokens;
