/*
 * Everything here is plain TypeScript with no Svelte and no ECharts import, so it runs anywhere:
 * the server, a worker, a test. Build an option here and hand it to `<Chart>`, or to ECharts
 * directly.
 */
export * from './types.js';
export * from './format.js';
export {
  applyTheme,
  axisStyle,
  chartFont,
  inkOn,
  seriesColor,
  tooltipCss,
  withDefaults,
} from './theme.js';
export type { ThemeOptions } from './theme.js';
export { describeCategories, describeSlices, describeTrend, extremes } from './describe.js';
export {
  buildBarOption,
  buildLineOption,
  categoryTable,
  describeBar,
  describeLine,
} from './builders/category.js';
export type { BarOptions, LineOptions } from './builders/category.js';
export {
  buildFunnelOption,
  buildPieOption,
  describeFunnel,
  describePie,
  sliceTable,
} from './builders/slices.js';
export type { FunnelOptions, PieOptions } from './builders/slices.js';
export {
  buildCandlestickOption,
  buildGaugeOption,
  buildHeatmapOption,
  buildRadarOption,
  buildSankeyOption,
  buildScatterOption,
  buildTreemapOption,
  candlestickTable,
  describeCandlestick,
  describeGauge,
  describeHeatmap,
  describeRadar,
  describeSankey,
  describeScatter,
  describeTreemap,
  gaugeTable,
  heatmapTable,
  linearFit,
  nodeValue,
  radarTable,
  sankeyTable,
  scatterTable,
  treemapTable,
} from './builders/more.js';
export type {
  CandlestickOptions,
  GaugeData,
  GaugeOptions,
  HeatmapOptions,
  RadarOptions,
  SankeyOptions,
  ScatterOptions,
  TreemapOptions,
} from './builders/more.js';
