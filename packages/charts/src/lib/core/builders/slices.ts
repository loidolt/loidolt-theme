import { chartColors } from '@loidolt/theme-tokens';
import { describeSlices } from '../describe.js';
import { formatNumber, type FormatOptions } from '../format.js';
import { inkOn, seriesColor } from '../theme.js';
import type { ChartColors, ChartOption, ChartTable, SliceDatum } from '../types.js';
import { invariant } from '../validate.js';

function checkSlices(data: SliceDatum[], builder: string) {
  for (const slice of data) {
    invariant(
      Number.isFinite(slice.value) && slice.value >= 0,
      builder,
      `"${slice.name}" must be a finite value of 0 or more, not ${slice.value}`
    );
  }
}

export interface PieOptions {
  /** Hole size as a percentage of the radius; above 0 draws a donut. */
  innerRadius?: number;
  showLabels?: boolean;
  /** Labels on leader lines outside, or printed on the slices. */
  labelPosition?: 'outside' | 'inside';
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Large text in a donut's hole, e.g. the total. */
  centerValue?: string;
  /** Small caption under `centerValue`. */
  centerLabel?: string;
  valueFormat?: FormatOptions;
}

/** A pie, or a donut with `innerRadius`. */
export function buildPieOption(
  data: SliceDatum[],
  options: PieOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  checkSlices(data, 'buildPieOption');
  const {
    innerRadius = 0,
    showLabels = true,
    labelPosition = 'outside',
    showLegend = false,
    showTooltip = true,
    centerValue,
    centerLabel,
    valueFormat,
  } = options;
  invariant(
    innerRadius >= 0 && innerRadius < 70,
    'buildPieOption',
    'innerRadius is a percentage below the outer radius (0–69)'
  );
  const format = (value: unknown) => formatNumber(value as number, valueFormat);
  const inside = labelPosition === 'inside';
  return {
    tooltip: showTooltip ? { trigger: 'item', valueFormatter: format } : undefined,
    legend: showLegend ? { type: 'scroll', bottom: 0, left: 'center' } : undefined,
    title:
      innerRadius > 0 && (centerValue || centerLabel)
        ? {
            text: centerValue,
            subtext: centerLabel,
            left: 'center',
            top: 'center',
            textStyle: { color: colors.text, fontSize: 22, fontWeight: 600 },
            subtextStyle: { color: colors.muted, fontSize: 11 },
            itemGap: 4,
          }
        : undefined,
    series: [
      {
        type: 'pie',
        radius: [`${innerRadius}%`, '70%'],
        center: ['50%', showLegend ? '45%' : '50%'],
        // Slices are divided by the surface colour, not an outline that competes with the data.
        itemStyle: { borderColor: colors.surface, borderWidth: 2 },
        label: showLabels
          ? {
              show: true,
              position: inside ? 'inside' : 'outside',
              color: colors.text,
              formatter: inside ? '{d}%' : '{b}',
            }
          : { show: false },
        labelLine: { show: showLabels && !inside, lineStyle: { color: colors.axis } },
        emphasis: { scale: true, scaleSize: 4 },
        data: data.map((slice, index) => {
          const color = slice.color ?? seriesColor(colors, index);
          return {
            name: slice.name,
            value: slice.value,
            itemStyle: { color },
            // Text printed on a slice takes whichever ink reads on that slice.
            label: inside ? { color: inkOn(color, colors) } : undefined,
          };
        }),
      },
    ],
  };
}

export interface FunnelOptions {
  /** `descending` puts the largest stage first; `none` keeps the given order. */
  sort?: 'descending' | 'ascending' | 'none';
  orientation?: 'vertical' | 'horizontal';
  showLabels?: boolean;
  showTooltip?: boolean;
  valueFormat?: FormatOptions;
}

/** Stages narrowing from first to last — a conversion funnel. */
export function buildFunnelOption(
  data: SliceDatum[],
  options: FunnelOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  checkSlices(data, 'buildFunnelOption');
  const {
    sort = 'descending',
    orientation = 'vertical',
    showLabels = true,
    showTooltip = true,
    valueFormat,
  } = options;
  const format = (value: unknown) => formatNumber(value as number, valueFormat);
  const max = Math.max(0, ...data.map((slice) => slice.value));
  return {
    tooltip: showTooltip ? { trigger: 'item', valueFormatter: format } : undefined,
    series: [
      {
        type: 'funnel',
        sort,
        orient: orientation,
        min: 0,
        max,
        left: '10%',
        right: '10%',
        top: 16,
        bottom: 16,
        gap: 2,
        itemStyle: { borderColor: colors.surface, borderWidth: 1 },
        label: showLabels ? { show: true, position: 'inside', formatter: '{b}' } : { show: false },
        data: data.map((slice, index) => {
          const color = slice.color ?? seriesColor(colors, index);
          return {
            name: slice.name,
            value: slice.value,
            itemStyle: { color },
            label: { color: inkOn(color, colors) },
          };
        }),
      },
    ],
  };
}

/** The data behind a pie, donut or funnel, with each part's share of the whole. */
export function sliceTable(
  data: SliceDatum[],
  { nameLabel = 'Name', valueLabel = 'Value', shareLabel = 'Share' } = {}
): ChartTable {
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  return {
    columns: [nameLabel, valueLabel, shareLabel],
    rows: data.map((slice) => [
      slice.name,
      slice.value,
      total ? `${Math.round((slice.value / total) * 1000) / 10}%` : null,
    ]),
  };
}

export const describePie = (data: SliceDatum[], format?: FormatOptions) =>
  describeSlices(data, { kind: 'pie chart', format });

export const describeFunnel = (data: SliceDatum[], format?: FormatOptions) => {
  if (!data.length) return 'Empty funnel chart.';
  const [first, last] = [data[0], data[data.length - 1]];
  const kept = first.value ? Math.round((last.value / first.value) * 100) : 0;
  return `Funnel chart of ${data.length} stages, from ${first.name} (${formatNumber(first.value, format)}) to ${last.name} (${formatNumber(last.value, format)}): ${kept}% carried through.`;
};
