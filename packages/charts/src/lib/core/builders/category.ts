import { chartColors } from '@loidolt/theme-tokens';
import { describeCategories } from '../describe.js';
import { formatNumber, type FormatOptions } from '../format.js';
import { seriesColor } from '../theme.js';
import type { CategoryData, ChartColors, ChartOption, ChartTable } from '../types.js';
import { checkCategories } from '../validate.js';

interface CategoryOptions {
  /** Show the legend. Defaults to on when there is more than one series. */
  showLegend?: boolean;
  showTooltip?: boolean;
  /** Horizontal gridlines behind the values. */
  showGrid?: boolean;
  stacked?: boolean;
  /** How values read on the axis and in the tooltip. */
  valueFormat?: FormatOptions;
  /** Axis titles. */
  categoryAxisName?: string;
  valueAxisName?: string;
}

export interface LineOptions extends CategoryOptions {
  /** Fill under each line — an area chart. */
  area?: boolean;
  smooth?: boolean;
  /** Mark each value with a dot, not only the line. Defaults to on for 12 or fewer categories. */
  showPoints?: boolean;
}

export interface BarOptions extends CategoryOptions {
  /** `horizontal` puts categories down the side, which suits long labels. */
  orientation?: 'vertical' | 'horizontal';
  /** Print each value on its bar. */
  showValues?: boolean;
}

function frame(data: CategoryData, options: CategoryOptions) {
  const { showLegend = data.series.length > 1, showTooltip = true, valueFormat } = options;
  const format = (value: unknown) => formatNumber(value as number, valueFormat);
  return {
    format,
    legend: showLegend ? { type: 'scroll', top: 0, left: 0 } : undefined,
    tooltip: showTooltip ? { trigger: 'axis', valueFormatter: format } : undefined,
    grid: { left: 8, right: 16, top: showLegend ? 40 : 16, bottom: 8, containLabel: true },
  };
}

/** Lines (or areas) over shared categories. */
export function buildLineOption(
  data: CategoryData,
  options: LineOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  checkCategories(data, 'buildLineOption');
  const { area = false, smooth = false, stacked = false, showGrid = true } = options;
  const showPoints = options.showPoints ?? data.categories.length <= 12;
  const { format, ...parts } = frame(data, options);
  return {
    ...parts,
    xAxis: {
      type: 'category',
      data: data.categories,
      boundaryGap: false,
      name: options.categoryAxisName,
    },
    yAxis: {
      type: 'value',
      name: options.valueAxisName,
      splitLine: { show: showGrid },
      axisLabel: { formatter: format },
    },
    series: data.series.map((series, index) => {
      const color = series.color ?? seriesColor(colors, index);
      return {
        type: 'line',
        name: series.name,
        data: series.data,
        smooth,
        stack: stacked ? 'total' : undefined,
        showSymbol: showPoints,
        symbol: 'rect',
        symbolSize: 6,
        itemStyle: { color },
        lineStyle: { color, width: 2 },
        areaStyle: area ? { color, opacity: stacked ? 0.8 : 0.16 } : undefined,
        emphasis: { focus: 'series' },
      };
    }),
  };
}

/** Bars over shared categories, side by side or stacked. */
export function buildBarOption(
  data: CategoryData,
  options: BarOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  checkCategories(data, 'buildBarOption');
  const {
    orientation = 'vertical',
    stacked = false,
    showValues = false,
    showGrid = true,
  } = options;
  const { format, ...parts } = frame(data, options);
  const categoryAxis = {
    type: 'category',
    data: data.categories,
    name: options.categoryAxisName,
    axisTick: { alignWithLabel: true },
  };
  const valueAxis = {
    type: 'value',
    name: options.valueAxisName,
    splitLine: { show: showGrid },
    axisLabel: { formatter: format },
  };
  const horizontal = orientation === 'horizontal';
  return {
    ...parts,
    tooltip: parts.tooltip && { ...parts.tooltip, axisPointer: { type: 'shadow' } },
    xAxis: horizontal ? valueAxis : categoryAxis,
    // Horizontal bars read top-down in data order, as a list does.
    yAxis: horizontal ? { ...categoryAxis, inverse: true } : valueAxis,
    series: data.series.map((series, index) => ({
      type: 'bar',
      name: series.name,
      data: series.data,
      stack: stacked ? 'total' : undefined,
      barMaxWidth: 48,
      itemStyle: { color: series.color ?? seriesColor(colors, index) },
      label: showValues
        ? {
            show: true,
            position: stacked ? 'inside' : horizontal ? 'right' : 'top',
            color: stacked ? colors.surface : colors.text,
            formatter: (params: { value: unknown }) => format(params.value),
          }
        : undefined,
      emphasis: { focus: 'series' },
    })),
  };
}

/** The data behind a line or bar chart: one row per category, one column per series. */
export function categoryTable(data: CategoryData, categoryLabel = 'Category'): ChartTable {
  return {
    columns: [categoryLabel, ...data.series.map((series) => series.name)],
    rows: data.categories.map((category, index) => [
      category,
      ...data.series.map((series) => series.data[index] ?? null),
    ]),
  };
}

export const describeLine = (data: CategoryData, format?: FormatOptions) =>
  describeCategories(data, { kind: 'line chart', format });

export const describeBar = (data: CategoryData, format?: FormatOptions) =>
  describeCategories(data, { kind: 'bar chart', format });
