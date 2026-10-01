import { chartColors } from '@loidolt/theme-tokens';
import { joinList } from '../describe.js';
import { formatCompact, formatNumber, type FormatOptions } from '../format.js';
import { seriesColor } from '../theme.js';
import type {
  CandlestickDatum,
  ChartColors,
  ChartOption,
  ChartTable,
  HeatmapData,
  RadarData,
  SankeyData,
  ScatterSeries,
  TreeNode,
} from '../types.js';
import { invariant } from '../validate.js';

const formatter = (format?: FormatOptions) => (value: unknown) =>
  formatNumber(value as number, format);

/* ── Scatter ─────────────────────────────────────────────────────────────── */

export interface ScatterOptions {
  /** Draw a least-squares line through each series. */
  showTrendLine?: boolean;
  /** Point size in pixels, or a function of the point. */
  symbolSize?: number | ((point: [number, number]) => number);
  showLegend?: boolean;
  showTooltip?: boolean;
  xAxisName?: string;
  yAxisName?: string;
  xFormat?: FormatOptions;
  yFormat?: FormatOptions;
}

/** The least-squares line through `points`, or `null` when it is undefined (all x equal). */
export function linearFit(
  points: Array<[number, number]>
): { slope: number; intercept: number } | null {
  const n = points.length;
  if (n < 2) return null;
  const [sumX, sumY] = points.reduce(([x, y], point) => [x + point[0], y + point[1]], [0, 0]);
  const [meanX, meanY] = [sumX / n, sumY / n];
  let numerator = 0;
  let denominator = 0;
  for (const [x, y] of points) {
    numerator += (x - meanX) * (y - meanY);
    denominator += (x - meanX) ** 2;
  }
  if (denominator === 0) return null;
  const slope = numerator / denominator;
  return { slope, intercept: meanY - slope * meanX };
}

export function buildScatterOption(
  data: ScatterSeries[],
  options: ScatterOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  const {
    showTrendLine = false,
    symbolSize = 8,
    showLegend = data.length > 1,
    showTooltip = true,
  } = options;
  const [formatX, formatY] = [formatter(options.xFormat), formatter(options.yFormat)];
  const series: Array<Record<string, unknown>> = [];
  data.forEach((one, index) => {
    const color = one.color ?? seriesColor(colors, index);
    series.push({
      type: 'scatter',
      name: one.name,
      data: one.data,
      symbolSize,
      itemStyle: { color, opacity: 0.85 },
      emphasis: { focus: 'series' },
    });
    const fit = showTrendLine ? linearFit(one.data) : null;
    if (fit) {
      const xs = one.data.map(([x]) => x);
      const [low, high] = [Math.min(...xs), Math.max(...xs)];
      series.push({
        type: 'line',
        name: `${one.name} trend`,
        data: [
          [low, fit.intercept + fit.slope * low],
          [high, fit.intercept + fit.slope * high],
        ],
        showSymbol: false,
        lineStyle: { color, type: 'dashed', width: 1.5 },
        tooltip: { show: false },
        silent: true,
      });
    }
  });
  return {
    legend: showLegend ? { type: 'scroll', top: 0, left: 0 } : undefined,
    tooltip: showTooltip
      ? {
          trigger: 'item',
          formatter: (params: { seriesName: string; value: [number, number] }) =>
            `${params.seriesName}<br>${formatX(params.value[0])}, ${formatY(params.value[1])}`,
        }
      : undefined,
    grid: { left: 8, right: 16, top: showLegend ? 40 : 16, bottom: 8, containLabel: true },
    xAxis: {
      type: 'value',
      name: options.xAxisName,
      scale: true,
      axisLabel: { formatter: formatX },
    },
    yAxis: {
      type: 'value',
      name: options.yAxisName,
      scale: true,
      axisLabel: { formatter: formatY },
    },
    series,
  };
}

export function scatterTable(
  data: ScatterSeries[],
  { seriesLabel = 'Series', xLabel = 'X', yLabel = 'Y' } = {}
): ChartTable {
  return {
    columns: [seriesLabel, xLabel, yLabel],
    rows: data.flatMap((one) => one.data.map(([x, y]) => [one.name, x, y])),
  };
}

export function describeScatter(data: ScatterSeries[]): string {
  const points = data.reduce((sum, one) => sum + one.data.length, 0);
  if (!points) return 'Empty scatter chart.';
  const trends = data.map((one) => {
    const fit = linearFit(one.data);
    const direction =
      !fit || fit.slope === 0
        ? 'no clear trend'
        : fit.slope > 0
          ? 'y rising with x'
          : 'y falling as x rises';
    return `${one.name}: ${one.data.length} points, ${direction}`;
  });
  return `Scatter chart of ${points} points in ${data.length} series. ${trends.join('; ')}.`;
}

/* ── Radar ───────────────────────────────────────────────────────────────── */

export interface RadarOptions {
  shape?: 'polygon' | 'circle';
  /** Fill each series' area. */
  area?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
}

export function buildRadarOption(
  data: RadarData,
  options: RadarOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  for (const one of data.series) {
    invariant(
      one.values.length === data.indicators.length,
      'buildRadarOption',
      `series "${one.name}" has ${one.values.length} values for ${data.indicators.length} indicators`
    );
  }
  const {
    shape = 'polygon',
    area = true,
    showLegend = data.series.length > 1,
    showTooltip = true,
  } = options;
  return {
    legend: showLegend ? { type: 'scroll', bottom: 0, left: 'center' } : undefined,
    tooltip: showTooltip ? { trigger: 'item' } : undefined,
    radar: {
      shape,
      radius: '65%',
      indicator: data.indicators.map((indicator, index) => ({
        name: indicator.name,
        min: indicator.min ?? 0,
        max:
          indicator.max ?? Math.max(1, ...data.series.map((one) => one.values[index] ?? 0)) * 1.1,
      })),
    },
    series: [
      {
        type: 'radar',
        data: data.series.map((one, index) => {
          const color = one.color ?? seriesColor(colors, index);
          return {
            name: one.name,
            value: one.values,
            symbol: 'rect',
            symbolSize: 5,
            itemStyle: { color },
            lineStyle: { color, width: 2 },
            areaStyle: area ? { color, opacity: 0.14 } : undefined,
          };
        }),
      },
    ],
  };
}

export function radarTable(data: RadarData, indicatorLabel = 'Measure'): ChartTable {
  return {
    columns: [indicatorLabel, ...data.series.map((one) => one.name)],
    rows: data.indicators.map((indicator, index) => [
      indicator.name,
      ...data.series.map((one) => one.values[index] ?? null),
    ]),
  };
}

export function describeRadar(data: RadarData): string {
  if (!data.series.length) return 'Empty radar chart.';
  const strongest = data.series.map((one) => {
    const best = one.values.indexOf(Math.max(...one.values));
    return `${one.name} is strongest in ${data.indicators[best]?.name ?? 'none'}`;
  });
  return `Radar chart comparing ${data.series.length} series across ${data.indicators.length} measures. ${strongest.join('; ')}.`;
}

/* ── Gauge ───────────────────────────────────────────────────────────────── */

export interface GaugeData {
  value: number;
  min?: number;
  max?: number;
}

export interface GaugeOptions {
  /** Major ticks around the dial. */
  splitNumber?: number;
  /** Fill the dial up to the value. */
  showProgress?: boolean;
  valueFormat?: FormatOptions;
  /** Caption under the value, e.g. the unit. */
  label?: string;
}

export function buildGaugeOption(
  data: GaugeData,
  options: GaugeOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  const { value, min = 0, max = 100 } = data;
  invariant(min < max, 'buildGaugeOption', `min (${min}) must be below max (${max})`);
  invariant(Number.isFinite(value), 'buildGaugeOption', 'value must be a finite number');
  const { splitNumber = 5, showProgress = true, valueFormat, label } = options;
  const format = formatter(valueFormat);
  return {
    series: [
      {
        type: 'gauge',
        min,
        max,
        splitNumber,
        radius: '90%',
        progress: { show: showProgress, width: 12, itemStyle: { color: colors.accent } },
        axisLine: { lineStyle: { width: 12, color: [[1, colors.grid]] } },
        axisTick: { distance: -12, length: 4, lineStyle: { color: colors.axis } },
        splitLine: { distance: -12, length: 12, lineStyle: { color: colors.axis, width: 1 } },
        axisLabel: { distance: 18, color: colors.muted, fontSize: 10, formatter: format },
        pointer: {
          show: !showProgress,
          width: 4,
          length: '62%',
          itemStyle: { color: colors.text },
        },
        anchor: {
          show: !showProgress,
          icon: 'rect',
          size: 10,
          itemStyle: { color: colors.text, borderWidth: 0 },
        },
        title: {
          show: Boolean(label),
          offsetCenter: [0, '72%'],
          color: colors.muted,
          fontSize: 11,
        },
        detail: {
          valueAnimation: true,
          offsetCenter: [0, '40%'],
          color: colors.text,
          fontSize: 24,
          fontWeight: 600,
          formatter: format,
        },
        data: [{ value, name: label ?? '' }],
      },
    ],
  };
}

export function gaugeTable(
  data: GaugeData,
  {
    readingLabel = 'Reading',
    valueLabel = 'Value',
    minLabel = 'Minimum',
    maxLabel = 'Maximum',
  } = {}
): ChartTable {
  return {
    columns: [readingLabel, valueLabel],
    rows: [
      [valueLabel, data.value],
      [minLabel, data.min ?? 0],
      [maxLabel, data.max ?? 100],
    ],
  };
}

export function describeGauge(data: GaugeData, format?: FormatOptions): string {
  const { value, min = 0, max = 100 } = data;
  const share = Math.round(((value - min) / (max - min)) * 100);
  return `Gauge reading ${formatNumber(value, format)} on a scale of ${formatNumber(min, format)} to ${formatNumber(max, format)} (${share}%).`;
}

/* ── Heatmap ─────────────────────────────────────────────────────────────── */

export interface HeatmapOptions {
  /** Print each cell's value. */
  showValues?: boolean;
  showTooltip?: boolean;
  /** Show the colour scale. */
  showScale?: boolean;
  valueFormat?: FormatOptions;
  /** Scale bounds. Default to the data's range. */
  min?: number;
  max?: number;
}

export function buildHeatmapOption(
  data: HeatmapData,
  options: HeatmapOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  for (const [x, y] of data.values) {
    invariant(
      Number.isInteger(x) &&
        Number.isInteger(y) &&
        x >= 0 &&
        y >= 0 &&
        x < data.x.length &&
        y < data.y.length,
      'buildHeatmapOption',
      `cell [${x}, ${y}] is outside the ${data.x.length} × ${data.y.length} grid`
    );
  }
  const values = data.values
    .map(([, , value]) => value)
    .filter((value): value is number => value != null);
  const { showValues = false, showTooltip = true, showScale = true, valueFormat } = options;
  const format = formatter(valueFormat);
  const min = options.min ?? Math.min(0, ...values);
  const max = options.max ?? Math.max(min + 1, ...values);
  return {
    tooltip: showTooltip
      ? {
          trigger: 'item',
          formatter: (params: { value: [number, number, number | null] }) => {
            const [x, y, value] = params.value;
            return `${data.y[y]} · ${data.x[x]}<br>${format(value)}`;
          },
        }
      : undefined,
    grid: { left: 8, right: 16, top: 16, bottom: showScale ? 56 : 8, containLabel: true },
    xAxis: { type: 'category', data: data.x, splitArea: { show: false } },
    yAxis: { type: 'category', data: data.y, splitArea: { show: false } },
    visualMap: {
      min,
      max,
      calculable: false,
      show: showScale,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      itemWidth: 12,
      formatter: format,
      inRange: { color: colors.sequential },
    },
    series: [
      {
        type: 'heatmap',
        data: data.values,
        itemStyle: { borderColor: colors.surface, borderWidth: 1 },
        label: showValues
          ? {
              show: true,
              fontSize: 10,
              formatter: (params: { value: [number, number, number | null] }) =>
                format(params.value[2]),
            }
          : { show: false },
        emphasis: { itemStyle: { borderColor: colors.text, borderWidth: 1 } },
      },
    ],
  };
}

export function heatmapTable(data: HeatmapData, cornerLabel = 'Row'): ChartTable {
  const grid: Array<Array<number | null>> = data.y.map(() => data.x.map(() => null));
  for (const [x, y, value] of data.values) grid[y][x] = value;
  return {
    columns: [cornerLabel, ...data.x],
    rows: data.y.map((label, index) => [label, ...grid[index]]),
  };
}

export function describeHeatmap(data: HeatmapData, format?: FormatOptions): string {
  let best: [number, number, number] | null = null;
  let worst: [number, number, number] | null = null;
  for (const [x, y, value] of data.values) {
    if (value == null) continue;
    if (!best || value > best[2]) best = [x, y, value];
    if (!worst || value < worst[2]) worst = [x, y, value];
  }
  const where = (cell: [number, number, number]) =>
    `${formatNumber(cell[2], format)} at ${data.y[cell[1]]} · ${data.x[cell[0]]}`;
  if (!best || !worst) return 'Empty heatmap.';
  return `Heatmap of ${data.y.length} rows by ${data.x.length} columns. Highest ${where(best)}; lowest ${where(worst)}.`;
}

/* ── Treemap ─────────────────────────────────────────────────────────────── */

export interface TreemapOptions {
  showTooltip?: boolean;
  /** The trail of parents above a zoomed-in node. */
  showBreadcrumb?: boolean;
  valueFormat?: FormatOptions;
}

/** A node's own value, or the sum of its children's. */
export const nodeValue = (node: TreeNode): number =>
  node.value ?? (node.children ?? []).reduce((sum, child) => sum + nodeValue(child), 0);

export function buildTreemapOption(
  data: TreeNode[],
  options: TreemapOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  const { showTooltip = true, showBreadcrumb = true, valueFormat } = options;
  const format = formatter(valueFormat);
  const colour = (nodes: TreeNode[], depth: number): unknown[] =>
    nodes.map((node, index) => {
      invariant(
        node.value === undefined || (Number.isFinite(node.value) && node.value >= 0),
        'buildTreemapOption',
        `"${node.name}" must have a value of 0 or more`
      );
      const color = node.color ?? (depth === 0 ? seriesColor(colors, index) : undefined);
      return {
        name: node.name,
        value: nodeValue(node),
        itemStyle: color ? { color } : undefined,
        children: node.children ? colour(node.children, depth + 1) : undefined,
      };
    });
  return {
    tooltip: showTooltip ? { trigger: 'item', valueFormatter: format } : undefined,
    series: [
      {
        type: 'treemap',
        roam: false,
        nodeClick: 'zoomToNode',
        top: 8,
        left: 0,
        right: 0,
        bottom: showBreadcrumb ? 32 : 0,
        breadcrumb: {
          show: showBreadcrumb,
          itemStyle: {
            color: colors.surface,
            borderColor: colors.axis,
            textStyle: { color: colors.text },
          },
          emphasis: { itemStyle: { color: colors.background } },
        },
        label: { show: true, color: colors.surface, fontSize: 11 },
        upperLabel: { show: false },
        itemStyle: { borderColor: colors.surface, borderWidth: 1, gapWidth: 1 },
        levels: [
          { itemStyle: { borderColor: colors.surface, borderWidth: 2, gapWidth: 2 } },
          { colorSaturation: [0.35, 0.6], itemStyle: { borderColorSaturation: 0.7, gapWidth: 1 } },
        ],
        data: colour(data, 0),
      },
    ],
  };
}

export function treemapTable(
  data: TreeNode[],
  { pathLabel = 'Item', valueLabel = 'Value' } = {}
): ChartTable {
  const rows: ChartTable['rows'] = [];
  const walk = (nodes: TreeNode[], trail: string[]) => {
    for (const node of nodes) {
      const path = [...trail, node.name];
      rows.push([path.join(' › '), nodeValue(node)]);
      if (node.children) walk(node.children, path);
    }
  };
  walk(data, []);
  return { columns: [pathLabel, valueLabel], rows };
}

export function describeTreemap(data: TreeNode[], format?: FormatOptions): string {
  if (!data.length) return 'Empty treemap.';
  const total = data.reduce((sum, node) => sum + nodeValue(node), 0);
  const top = [...data]
    .sort((a, b) => nodeValue(b) - nodeValue(a))
    .slice(0, 3)
    .map((node) => `${node.name} ${formatNumber(nodeValue(node), format)}`);
  return `Treemap of ${data.length} groups totalling ${formatNumber(total, format)}. Largest: ${joinList(top)}.`;
}

/* ── Candlestick ─────────────────────────────────────────────────────────── */

export interface CandlestickOptions {
  /** Volume bars under the price, when the data carries `volume`. */
  showVolume?: boolean;
  /** Drag and wheel to zoom along the dates, with a slider under the chart. */
  zoom?: boolean;
  showTooltip?: boolean;
  /** Rising and falling colours. Default to the gain and loss tokens. */
  upColor?: string;
  downColor?: string;
  valueFormat?: FormatOptions;
}

export function buildCandlestickOption(
  data: CandlestickDatum[],
  options: CandlestickOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  for (const day of data) {
    invariant(
      day.low <= Math.min(day.open, day.close) && day.high >= Math.max(day.open, day.close),
      'buildCandlestickOption',
      `${day.date}: low and high must bracket open and close`
    );
  }
  const {
    showVolume = data.some((day) => day.volume != null),
    zoom = false,
    showTooltip = true,
    upColor = colors.positive,
    downColor = colors.negative,
    valueFormat,
  } = options;
  const format = formatter(valueFormat);
  const dates = data.map((day) => day.date);
  // Price takes most of the height; volume a strip under it, above the zoom slider if any.
  const bottom = zoom ? 48 : 8;
  const grids = showVolume
    ? [
        { left: 8, right: 16, top: 16, bottom: zoom ? '38%' : '28%', containLabel: true },
        { left: 8, right: 16, height: '16%', bottom, containLabel: true },
      ]
    : [{ left: 8, right: 16, top: 16, bottom, containLabel: true }];
  const axes = showVolume ? [0, 1] : [0];
  return {
    tooltip: showTooltip
      ? { trigger: 'axis', axisPointer: { type: 'cross' }, valueFormatter: format }
      : undefined,
    axisPointer: showVolume ? { link: [{ xAxisIndex: 'all' }] } : undefined,
    grid: grids,
    xAxis: axes.map((index) => ({
      type: 'category',
      gridIndex: index,
      data: dates,
      boundaryGap: true,
      axisLabel: { show: index === axes.length - 1 },
    })),
    yAxis: axes.map((index) =>
      index === 0
        ? {
            type: 'value',
            gridIndex: 0,
            scale: true,
            splitNumber: 4,
            axisLabel: { formatter: format },
          }
        : {
            type: 'value',
            gridIndex: 1,
            splitNumber: 1,
            splitLine: { show: false },
            axisLabel: { formatter: (value: number) => formatCompact(value) },
          }
    ),
    dataZoom: zoom
      ? [
          { type: 'inside', xAxisIndex: axes },
          { type: 'slider', xAxisIndex: axes, bottom: 8, height: 24 },
        ]
      : undefined,
    series: [
      {
        type: 'candlestick',
        name: 'Price',
        data: data.map((day) => [day.open, day.close, day.low, day.high]),
        itemStyle: {
          color: upColor,
          color0: downColor,
          borderColor: upColor,
          borderColor0: downColor,
        },
      },
      ...(showVolume
        ? [
            {
              type: 'bar',
              name: 'Volume',
              xAxisIndex: 1,
              yAxisIndex: 1,
              data: data.map((day) => ({
                value: day.volume ?? null,
                itemStyle: { color: day.close >= day.open ? upColor : downColor, opacity: 0.6 },
              })),
            },
          ]
        : []),
    ],
  };
}

export function candlestickTable(
  data: CandlestickDatum[],
  {
    dateLabel = 'Date',
    openLabel = 'Open',
    highLabel = 'High',
    lowLabel = 'Low',
    closeLabel = 'Close',
    volumeLabel = 'Volume',
  } = {}
): ChartTable {
  const volume = data.some((day) => day.volume != null);
  return {
    columns: [
      dateLabel,
      openLabel,
      highLabel,
      lowLabel,
      closeLabel,
      ...(volume ? [volumeLabel] : []),
    ],
    rows: data.map((day) => [
      day.date,
      day.open,
      day.high,
      day.low,
      day.close,
      ...(volume ? [day.volume ?? null] : []),
    ]),
  };
}

export function describeCandlestick(data: CandlestickDatum[], format?: FormatOptions): string {
  if (!data.length) return 'Empty candlestick chart.';
  const [first, last] = [data[0], data[data.length - 1]];
  const high = Math.max(...data.map((day) => day.high));
  const low = Math.min(...data.map((day) => day.low));
  const change = first.open ? Math.round(((last.close - first.open) / first.open) * 1000) / 10 : 0;
  return `Candlestick chart of ${data.length} periods, ${first.date} to ${last.date}. Opened at ${formatNumber(first.open, format)} and closed at ${formatNumber(last.close, format)} (${change >= 0 ? '+' : ''}${change}%), trading between ${formatNumber(low, format)} and ${formatNumber(high, format)}.`;
}

/* ── Sankey ──────────────────────────────────────────────────────────────── */

export interface SankeyOptions {
  orientation?: 'horizontal' | 'vertical';
  showTooltip?: boolean;
  valueFormat?: FormatOptions;
}

export function buildSankeyOption(
  data: SankeyData,
  options: SankeyOptions = {},
  colors: ChartColors = chartColors()
): ChartOption {
  const names = new Set(data.nodes.map((node) => node.name));
  for (const link of data.links) {
    invariant(
      names.has(link.source) && names.has(link.target),
      'buildSankeyOption',
      `link ${link.source} → ${link.target} names a node that is not in \`nodes\``
    );
    invariant(link.source !== link.target, 'buildSankeyOption', `${link.source} links to itself`);
    invariant(
      link.value > 0,
      'buildSankeyOption',
      `link ${link.source} → ${link.target} needs a positive value`
    );
  }
  const { orientation = 'horizontal', showTooltip = true, valueFormat } = options;
  return {
    tooltip: showTooltip ? { trigger: 'item', valueFormatter: formatter(valueFormat) } : undefined,
    series: [
      {
        type: 'sankey',
        orient: orientation,
        left: 8,
        right: orientation === 'horizontal' ? 96 : 8,
        top: 8,
        bottom: orientation === 'horizontal' ? 8 : 32,
        nodeWidth: 12,
        nodeGap: 10,
        emphasis: { focus: 'adjacency' },
        label: { color: colors.text },
        lineStyle: { color: 'gradient', opacity: 0.35, curveness: 0.5 },
        itemStyle: { borderWidth: 0 },
        data: data.nodes.map((node, index) => ({
          name: node.name,
          itemStyle: { color: node.color ?? seriesColor(colors, index) },
        })),
        links: data.links,
      },
    ],
  };
}

export function sankeyTable(
  data: SankeyData,
  { sourceLabel = 'From', targetLabel = 'To', valueLabel = 'Value' } = {}
): ChartTable {
  return {
    columns: [sourceLabel, targetLabel, valueLabel],
    rows: data.links.map((link) => [link.source, link.target, link.value]),
  };
}

export function describeSankey(data: SankeyData, format?: FormatOptions): string {
  if (!data.links.length) return 'Empty flow diagram.';
  const top = [...data.links]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3)
    .map((link) => `${link.source} to ${link.target} (${formatNumber(link.value, format)})`);
  return `Flow diagram of ${data.links.length} flows between ${data.nodes.length} nodes. Largest: ${joinList(top)}.`;
}
