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

export const ref = (name: string): TokenRef => ({ $ref: `--loidolt-${name}` });

export const isRef = (value: unknown): value is TokenRef =>
  typeof value === 'object' && value !== null && '$ref' in value;

const kebab = (value: string) =>
  value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`).replace(/([a-z])(\d)/g, '$1-$2');

/**
 * `['font', 'lineHeight', 'tight']` → `--loidolt-font-line-height-tight`; a trailing number is its
 * own segment, so `chart1` → `--loidolt-chart-1`.
 */
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
  /**
   * Categorical series for charts, in the order they are handed out. Earth tones that stay apart
   * from each other and hold 3:1 against every surface, so a line or bar needs no outline.
   */
  series: {
    1: '#c65224',
    2: '#2f6f8a',
    3: '#5b7a3a',
    4: '#9a6a12',
    5: '#7a4a78',
    6: '#4d5a6a',
    7: '#2f7d6d',
    8: '#8a5a3c',
  },
  /** One warm hue from little to most: heatmaps, choropleths, cluster sizes. */
  sequential: {
    1: '#ecd3b8',
    2: '#dea67a',
    3: '#c97a45',
    4: '#a4521f',
    5: '#6e3314',
  },
  /** Below and above a midpoint: slate for below, orange for above, the neutral paper between. */
  diverging: {
    1: '#265162',
    2: '#4f8196',
    3: '#9cbac3',
    4: '#ddd7c9',
    5: '#e0a986',
    6: '#c96f3d',
    7: '#9b3a17',
  },
  /**
   * Code highlighting. Code sits on the inverse surface — dark in the light theme — so these are
   * the light inks; the dark theme's code block is light, and takes dark ones.
   */
  syntax: {
    keyword: '#f0895c',
    string: '#a3c197',
    comment: '#b5ae9c',
    constant: '#e2b56c',
    function: '#8fc0d4',
    parameter: '#d3a8cf',
    punctuation: '#d8d2c4',
  },
  /** Basemap fills. Quiet by design: the data drawn on top carries the colour. */
  map: {
    water: '#b9cdd3',
    park: '#d3d8bd',
    road: '#f5f2e9',
    roadMajor: '#ffffff',
    building: '#d8d3c7',
  },
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
 * The default preset is square by design: `radius` is 0 and every control keeps a hard corner.
 * `radiusPill` is the deliberate exception, reserved for badges — the one element that must not
 * read as pressable, and reads that way precisely because nothing else is round. Components read
 * radius through the `radius-*` roles below, which a preset can round independently.
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
 * Named frames for media, as CSS `aspect-ratio` values. `Thumbnail`, `AspectRatio` and the media
 * components accept these names so a gallery and its lightbox agree on shape.
 */
export const aspectRatio = {
  square: '1 / 1',
  video: '16 / 9',
  photo: '4 / 3',
  portrait: '3 / 4',
  wide: '21 / 9',
} as const;

/**
 * The role layer. Every value links to a primitive, so overriding a primitive propagates and
 * overriding a role restyles every component that plays it.
 */
export const semanticDefs = {
  background: ref('color-paper'),
  surface: ref('color-panel'),
  surfaceAlt: ref('color-panel-alt'),
  surfaceSunken: ref('color-canvas'),
  /** Artwork-on-paper backing: stays white in every theme so previews read true. */
  surfacePaper: ref('color-white'),
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
  /*
   * Data visualisation. `chart1`…`chart8` are categorical series; the ramps run from "least" (1)
   * to "most" (last), whatever the theme; the diverging midpoint (4) is the neutral.
   */
  chart1: ref('color-series-1'),
  chart2: ref('color-series-2'),
  chart3: ref('color-series-3'),
  chart4: ref('color-series-4'),
  chart5: ref('color-series-5'),
  chart6: ref('color-series-6'),
  chart7: ref('color-series-7'),
  chart8: ref('color-series-8'),
  chartSequential1: ref('color-sequential-1'),
  chartSequential2: ref('color-sequential-2'),
  chartSequential3: ref('color-sequential-3'),
  chartSequential4: ref('color-sequential-4'),
  chartSequential5: ref('color-sequential-5'),
  chartDiverging1: ref('color-diverging-1'),
  chartDiverging2: ref('color-diverging-2'),
  chartDiverging3: ref('color-diverging-3'),
  chartDiverging4: ref('color-diverging-4'),
  chartDiverging5: ref('color-diverging-5'),
  chartDiverging6: ref('color-diverging-6'),
  chartDiverging7: ref('color-diverging-7'),
  /** Gains and losses: candlestick up/down, positive/negative bars. */
  chartPositive: ref('color-success'),
  chartNegative: ref('color-error'),
  /* Basemap roles, read by the map style generator. */
  mapLand: ref('color-paper'),
  mapWater: ref('color-map-water'),
  mapPark: ref('color-map-park'),
  mapRoad: ref('color-map-road'),
  mapRoadMajor: ref('color-map-road-major'),
  mapBuilding: ref('color-map-building'),
  mapBoundary: ref('color-line-strong'),
  mapLabel: ref('color-deep'),
  mapLabelHalo: ref('color-panel'),
  /* Code highlighting, on the inverse surface where code blocks sit. */
  syntaxKeyword: ref('color-syntax-keyword'),
  syntaxString: ref('color-syntax-string'),
  syntaxComment: ref('color-syntax-comment'),
  syntaxConstant: ref('color-syntax-constant'),
  syntaxFunction: ref('color-syntax-function'),
  syntaxParameter: ref('color-syntax-parameter'),
  syntaxPunctuation: ref('color-syntax-punctuation'),
} as const satisfies Record<string, string | TokenRef>;

/**
 * The shape-and-voice layer: the non-colour roles a preset restyles. Like the colour roles, each
 * names a *job* (the corner of a control, the padding of a table cell, the case of a label) rather
 * than a component, so one value moves every component that does that job.
 *
 * Every default reproduces the original hand-written value exactly; a preset that sets none of
 * them looks identical to the base system.
 */
export const roleDefs = {
  /** Buttons, boxed fields, toggle groups, switches, swatches, tooltips. */
  radiusControl: ref('border-radius'),
  /** Rows and items inside a rounded container (menu items, list rows, filmstrip frames). */
  radiusInner: '0px',
  /** Cards, panels, tables, alerts, code blocks, thumbnails. */
  radiusSurface: ref('border-radius'),
  /** Dialogs, popovers, menus, toasts. Drawers stay square: they are anchored to an edge. */
  radiusOverlay: ref('border-radius'),

  /** Width of the keyboard focus ring. WCAG 2.4.13 wants at least 2px; keep it there. */
  strokeFocus: '2px',
  /** Selected-tab, active-nav and selected-row indicators. */
  strokeIndicator: '2px',
  /** The status bar on the leading edge of an alert or toast. */
  strokeAccent: '3px',

  /*
   * Density. Discrete roles rather than one runtime multiplier: computed values stay readable in
   * devtools, and a preset can move one role without dragging the rest. `definePreset({ density })`
   * scales them all at build time when one knob is what you want.
   */
  padControlX: '0.85rem',
  padControlXSm: '0.65rem',
  padControlXLg: '1.2rem',
  padControlY: '0.5rem',
  padControlYSm: '0.38rem',
  /** Underlined fields: vertical, then horizontal. Boxed fields use `pad-control-x-sm` inline. */
  padField: '0.45rem 0.15rem',
  padItem: '0.65rem 0.55rem',
  padCell: '0.7rem 0.8rem',
  padCallout: '0.8rem 1rem',
  padSurface: ref('space-4'),
  padOverlay: '1rem 1.25rem',
  padPopover: '0.45rem',
  padBarX: '1.35rem',
  padPane: '1.25rem',
  padPage: ref('space-6'),
  /** Between a field's label, control and help text. */
  gapField: '0.35rem',
  /** Between the buttons of a dialog footer or an empty state. */
  gapActions: ref('space-2'),

  /*
   * Voice: how labels and controls speak. The default shouts — small uppercase utility type,
   * tracked out — and a preset can bring it back to sentence case. Tracking roles keep a unit
   * because stylesheets derive from them with `calc()`.
   */
  labelTransform: 'uppercase',
  labelTracking: ref('font-tracking-utility'),
  labelTrackingWide: ref('font-tracking-wide'),
  labelWeight: '400',
  controlTransform: 'uppercase',
  controlTracking: '0.08em',
  controlWeight: '400',
  headingWeight: '500',
  strongWeight: '600',
} as const satisfies Record<string, string | TokenRef>;

export type TokenTree = { readonly [key: string]: string | TokenRef | TokenTree };

export const PRIMITIVE_GROUPS: ReadonlyArray<readonly [string, TokenTree]> = [
  ['color', colors],
  ['font', typography],
  ['space', spacing],
  ['size', sizing],
  ['border', borders],
  ['shadow', shadows],
  ['motion', motion],
  ['z', zIndex],
  ['aspect', aspectRatio],
];

export const flattenInto = (
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
  for (const [name, value] of Object.entries(roleDefs)) out.push([cssVarName([name]), value]);
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

const resolveDefs = <T extends Record<string, string | TokenRef>>(defs: T) =>
  Object.fromEntries(
    Object.entries(defs).map(([name, value]) => [
      name,
      isRef(value) ? (resolved.get(value.$ref) ?? '') : value,
    ])
  ) as { readonly [K in keyof T]: string };

/** Semantic roles with their refs resolved to concrete values, for TS/JS consumers. */
export const semantic = resolveDefs(semanticDefs);

/** Shape and voice roles with their refs resolved to concrete values. */
export const roles = resolveDefs(roleDefs);

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
  surfacePaper: '#ffffff',
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
  chart1: '#e0672f',
  chart2: '#6ea5bd',
  chart3: '#93b287',
  chart4: '#d9ab63',
  chart5: '#c49ac0',
  chart6: '#b8ad96',
  chart7: '#6fb8a6',
  chart8: '#c79a78',
  chartSequential1: '#3a2a1d',
  chartSequential2: '#6b4225',
  chartSequential3: '#a4602f',
  chartSequential4: '#d98a4d',
  chartSequential5: '#f2bd8a',
  chartDiverging1: '#85b6ca',
  chartDiverging2: '#5a8ea3',
  chartDiverging3: '#35596a',
  chartDiverging4: '#3a3d34',
  chartDiverging5: '#7a4428',
  chartDiverging6: '#bf6a3a',
  chartDiverging7: '#f0895c',
  chartPositive: '#93b287',
  chartNegative: '#e88b81',
  mapLand: '#161814',
  mapWater: '#1d2b31',
  mapPark: '#1f271c',
  mapRoad: '#2b2e26',
  mapRoadMajor: '#3a3d34',
  mapBuilding: '#24271f',
  mapBoundary: '#787c6b',
  mapLabel: '#ebe7dc',
  mapLabelHalo: '#161814',
  syntaxKeyword: '#a9441d',
  syntaxString: '#3f5139',
  syntaxComment: '#5f5b50',
  syntaxConstant: '#7c4d17',
  syntaxFunction: '#265162',
  syntaxParameter: '#7a4a78',
  syntaxPunctuation: '#474a42',
} as const satisfies Record<keyof typeof semanticDefs, string>;

export type ColorScheme = 'light' | 'dark';
export type SemanticRole = keyof typeof semanticDefs;

/** The custom property a semantic role is published as: `chart1` → `--loidolt-chart-1`. */
export const roleVar = (role: SemanticRole) => cssVarName([role]);

/**
 * A role's concrete value in the reference light or dark theme. Canvas and WebGL renderers cannot
 * read `var()`, and neither can the server: this is what they fall back to when the live value
 * cannot be read from the page.
 */
export const roleValue = (role: SemanticRole, scheme: ColorScheme = 'light'): string =>
  scheme === 'dark' ? darkSemantic[role] : semantic[role];

/** Names roles — singly or as an ordered list — under keys a renderer understands. */
export type RoleSpec = { readonly [key: string]: SemanticRole | readonly SemanticRole[] };

export type ResolvedRoles<S extends RoleSpec> = {
  -readonly [K in keyof S]: S[K] extends readonly SemanticRole[] ? string[] : string;
};

/**
 * Resolves every role in `spec`. `read` defaults to the reference theme; a runtime passes one
 * that reads the page, so a consumer's own theme reaches the canvas too.
 */
export function resolveRoles<S extends RoleSpec>(
  spec: S,
  scheme: ColorScheme = 'light',
  read: (role: SemanticRole) => string = (role) => roleValue(role, scheme)
): ResolvedRoles<S> {
  return Object.fromEntries(
    Object.entries(spec).map(([key, value]) => [
      key,
      typeof value === 'string' ? read(value as SemanticRole) : value.map((role) => read(role)),
    ])
  ) as ResolvedRoles<S>;
}

/** The roles a chart is painted with. */
export const chartRoles = {
  categorical: ['chart1', 'chart2', 'chart3', 'chart4', 'chart5', 'chart6', 'chart7', 'chart8'],
  sequential: [
    'chartSequential1',
    'chartSequential2',
    'chartSequential3',
    'chartSequential4',
    'chartSequential5',
  ],
  diverging: [
    'chartDiverging1',
    'chartDiverging2',
    'chartDiverging3',
    'chartDiverging4',
    'chartDiverging5',
    'chartDiverging6',
    'chartDiverging7',
  ],
  positive: 'chartPositive',
  negative: 'chartNegative',
  text: 'text',
  muted: 'textMuted',
  axis: 'border',
  grid: 'borderSoft',
  surface: 'surface',
  background: 'background',
  accent: 'accent',
} as const satisfies RoleSpec;

/** The roles a basemap and map overlays are painted with. */
export const mapRoles = {
  land: 'mapLand',
  water: 'mapWater',
  park: 'mapPark',
  road: 'mapRoad',
  roadMajor: 'mapRoadMajor',
  building: 'mapBuilding',
  boundary: 'mapBoundary',
  label: 'mapLabel',
  labelHalo: 'mapLabelHalo',
  accent: 'accent',
  text: 'text',
  surface: 'surface',
  focus: 'focusRing',
  categorical: chartRoles.categorical,
  sequential: chartRoles.sequential,
} as const satisfies RoleSpec;

/** The roles code is highlighted with, and the surface it sits on. */
export const syntaxRoles = {
  background: 'surfaceInverse',
  text: 'textInverse',
  keyword: 'syntaxKeyword',
  string: 'syntaxString',
  comment: 'syntaxComment',
  constant: 'syntaxConstant',
  function: 'syntaxFunction',
  parameter: 'syntaxParameter',
  punctuation: 'syntaxPunctuation',
} as const satisfies RoleSpec;

export type SyntaxColors = ResolvedRoles<typeof syntaxRoles>;

/** Syntax colours in the reference theme. */
export const syntaxColors = (scheme: ColorScheme = 'light'): SyntaxColors =>
  resolveRoles(syntaxRoles, scheme);

export type ChartColors = ResolvedRoles<typeof chartRoles>;
export type MapColors = ResolvedRoles<typeof mapRoles>;

/** Chart colours in the reference theme. */
export const chartColors = (scheme: ColorScheme = 'light'): ChartColors =>
  resolveRoles(chartRoles, scheme);

/** Map colours in the reference theme. */
export const mapColors = (scheme: ColorScheme = 'light'): MapColors =>
  resolveRoles(mapRoles, scheme);

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
  aspectRatio,
  semantic,
  darkSemantic,
  roles,
} as const;
export type ThemeTokens = typeof tokens;
