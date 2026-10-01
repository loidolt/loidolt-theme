import { chartColors, getContrastTextColor, typography } from '@loidolt/theme-tokens';
import type { ChartColors, ChartOption } from './types.js';

type Plain = Record<string, unknown>;

const isPlain = (value: unknown): value is Plain =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Fills in what `target` leaves unset from `defaults`, recursively. Never overwrites a value. */
export function withDefaults<T extends Plain>(target: T, defaults: Plain): T {
  const out: Plain = { ...target };
  for (const [key, fallback] of Object.entries(defaults)) {
    const own = out[key];
    if (own === undefined) out[key] = fallback;
    else if (isPlain(own) && isPlain(fallback)) out[key] = withDefaults(own, fallback);
  }
  return out as T;
}

/** Applies `defaults` to one component, or to each when the option holds a list of them. */
const eachComponent = (value: unknown, defaults: Plain) =>
  Array.isArray(value)
    ? value.map((item) => (isPlain(item) ? withDefaults(item, defaults) : item))
    : isPlain(value)
      ? withDefaults(value, defaults)
      : value;

/** Inline styles that dress an ECharts tooltip as a loidolt popover. */
export const tooltipCss = [
  'border-radius: 0',
  'border-color: var(--loidolt-border-strong)',
  'background-color: var(--loidolt-surface)',
  'color: var(--loidolt-text)',
  'box-shadow: var(--loidolt-shadow-popover)',
  'font-family: var(--loidolt-font-utility)',
].join('; ');

/** Text in charts uses the utility face, as every other label in the system does. */
export const chartFont = typography.utility;

/** Axis styling from the theme: hairline axes, soft gridlines, muted labels. */
export function axisStyle(colors: ChartColors): Plain {
  return {
    axisLine: { lineStyle: { color: colors.axis } },
    axisTick: { lineStyle: { color: colors.axis } },
    axisLabel: { color: colors.muted, fontFamily: chartFont, fontSize: 11 },
    splitLine: { lineStyle: { color: colors.grid } },
    nameTextStyle: { color: colors.muted, fontFamily: chartFont },
  };
}

export interface ThemeOptions {
  /** Turn transitions off, e.g. for `prefers-reduced-motion`. */
  animation?: boolean;
  /** Patterns on fills, so series stay apart without colour (WCAG 1.4.1). */
  decal?: boolean;
}

/**
 * Themes an option: the categorical palette, text in the utility face, axes, legend and tooltip —
 * everything the option leaves unset. Anything the option sets itself wins, so a caller can
 * override a single colour without restating the theme.
 */
export function applyTheme(
  option: ChartOption,
  colors: ChartColors = chartColors(),
  { animation = true, decal = false }: ThemeOptions = {}
): ChartOption {
  const axis = axisStyle(colors);
  const themed = withDefaults(option, {
    color: colors.categorical,
    backgroundColor: 'transparent',
    textStyle: { color: colors.text, fontFamily: chartFont, fontSize: 12 },
    animation,
    // Descriptions are supplied by the component, so ECharts' generated label stays off; its
    // decal patterns are the part of `aria` worth having.
    aria: { enabled: decal, label: { enabled: false }, decal: { show: decal } },
  });
  if (!animation) themed.animation = false;

  for (const key of ['xAxis', 'yAxis', 'singleAxis']) {
    if (key in themed) themed[key] = eachComponent(themed[key], axis);
  }
  if ('radar' in themed) {
    themed.radar = eachComponent(themed.radar, {
      axisName: { color: colors.muted, fontFamily: chartFont },
      axisLine: { lineStyle: { color: colors.grid } },
      splitLine: { lineStyle: { color: colors.grid } },
      splitArea: { show: false },
    });
  }
  if ('legend' in themed) {
    themed.legend = eachComponent(themed.legend, {
      textStyle: { color: colors.text, fontFamily: chartFont },
      inactiveColor: colors.grid,
      icon: 'rect',
      itemWidth: 12,
      itemHeight: 12,
    });
  }
  if ('tooltip' in themed) {
    themed.tooltip = eachComponent(themed.tooltip, {
      className: 'ldt-chart-tooltip',
      backgroundColor: colors.surface,
      borderColor: colors.text,
      borderWidth: 1,
      padding: [7, 10],
      // The tooltip is DOM, so it can wear a popover's tokens directly; these come after the
      // inline styles ECharts writes, and follow the theme without a repaint.
      extraCssText: tooltipCss,
      textStyle: { color: colors.text, fontFamily: chartFont },
      axisPointer: { lineStyle: { color: colors.axis }, crossStyle: { color: colors.axis } },
    });
  }
  if ('visualMap' in themed) {
    themed.visualMap = eachComponent(themed.visualMap, {
      inRange: { color: colors.sequential },
      textStyle: { color: colors.muted, fontFamily: chartFont },
    });
  }
  if ('dataZoom' in themed) {
    themed.dataZoom = eachComponent(themed.dataZoom, {
      backgroundColor: 'transparent',
      borderColor: colors.axis,
      fillerColor: `${colors.accent.slice(0, 7)}29`,
      textStyle: { color: colors.muted, fontFamily: chartFont },
      dataBackground: { lineStyle: { color: colors.axis }, areaStyle: { color: colors.grid } },
      selectedDataBackground: {
        lineStyle: { color: colors.accent },
        areaStyle: { color: colors.accent, opacity: 0.2 },
      },
      handleStyle: { color: colors.surface, borderColor: colors.text },
      moveHandleStyle: { color: colors.axis, opacity: 1 },
      emphasis: {
        handleStyle: { borderColor: colors.accent },
        moveHandleStyle: { color: colors.accent },
      },
    });
  }
  return themed;
}

/** The palette colour for the `index`th series, wrapping round after eight. */
export const seriesColor = (colors: ChartColors, index: number) =>
  colors.categorical[index % colors.categorical.length];

/**
 * Whichever of the theme's text or surface colour reads better on `fill` — for labels printed on
 * a slice or a funnel stage. Falls back to the text colour when any of them is not hex.
 */
export function inkOn(fill: string, colors: ChartColors): string {
  const hex = /^#[0-9a-f]{6}/i;
  if (![fill, colors.text, colors.surface].every((value) => hex.test(value))) return colors.text;
  // `getContrastTextColor` just picks the better of two inks; which is "dark" does not matter.
  return getContrastTextColor(fill.slice(0, 7), {
    dark: colors.text.slice(0, 7),
    light: colors.surface.slice(0, 7),
  });
}
