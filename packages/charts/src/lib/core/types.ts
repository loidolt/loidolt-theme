import type { ChartColors } from '@loidolt/theme-tokens';

export type { ChartColors };

/**
 * An ECharts option object. Kept structural rather than tied to ECharts' own `EChartsOption`, so
 * the pure builders in `/core` stay importable without the chart library installed.
 */
export type ChartOption = Record<string, unknown>;

/** An option, or a function that builds one from the resolved theme colours. */
export type ChartOptionSource = ChartOption | ((colors: ChartColors) => ChartOption);

/** A cell in a chart's data-table alternative. */
export type ChartCell = string | number | null;

/** The data behind a chart as a table — its non-visual alternative. */
export interface ChartTable {
  /** Column headings; the first usually names the category or row. */
  columns: string[];
  rows: ChartCell[][];
}

/** One named series over shared categories (line, bar, area). */
export interface CategorySeries {
  name: string;
  /** One value per category; `null` leaves a gap. */
  data: Array<number | null>;
  /** Overrides the palette colour for this series. */
  color?: string;
}

export interface CategoryData {
  categories: string[];
  series: CategorySeries[];
}

/** One slice of a part-to-whole chart (pie, donut, funnel). */
export interface SliceDatum {
  name: string;
  value: number;
  color?: string;
}

export interface ScatterSeries {
  name: string;
  /** `[x, y]` points. */
  data: Array<[number, number]>;
  color?: string;
}

export interface RadarData {
  /** The spokes. `max` defaults to the largest value on that spoke. */
  indicators: Array<{ name: string; max?: number; min?: number }>;
  series: Array<{ name: string; values: number[]; color?: string }>;
}

export interface HeatmapData {
  x: string[];
  y: string[];
  /** `[xIndex, yIndex, value]` cells; missing cells stay empty. */
  values: Array<[number, number, number | null]>;
}

export interface TreeNode {
  name: string;
  /** Leaf size. A branch without one is the sum of its children. */
  value?: number;
  children?: TreeNode[];
  color?: string;
}

export interface CandlestickDatum {
  /** Category label, usually a date. */
  date: string;
  open: number;
  close: number;
  low: number;
  high: number;
  volume?: number;
}

export interface SankeyData {
  nodes: Array<{ name: string; color?: string }>;
  links: Array<{ source: string; target: string; value: number }>;
}

/** What a click or keyboard activation on a data point reports. */
export interface ChartItemEvent {
  /** `series`, `legend`, … as ECharts reports it. */
  componentType: string;
  seriesName?: string;
  seriesIndex?: number;
  /** The category, slice or node name. */
  name: string;
  dataIndex?: number;
  value: unknown;
}
