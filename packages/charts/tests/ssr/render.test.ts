import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import * as lib from '../../src/lib/index.js';
import { samples } from '../fixtures.js';

/**
 * Server-renders every component. ECharts is never touched on the server: the figure, its
 * caption, the description and the data table all render, and the chart itself draws on mount.
 */
const cases: Array<[keyof typeof lib, Record<string, unknown>]> = [
  ['Chart', { title: 'Generic', option: { series: [] }, table: { columns: ['A'], rows: [['x']] } }],
  ['ChartDataTable', { caption: 'Table', table: { columns: ['A', 'B'], rows: [['x', 1]] } }],
  ['LineChart', { title: 'Line', data: samples.category }],
  ['BarChart', { title: 'Bar', data: samples.category }],
  ['PieChart', { title: 'Pie', data: samples.slices }],
  ['FunnelChart', { title: 'Funnel', data: samples.slices }],
  ['ScatterChart', { title: 'Scatter', data: samples.scatter }],
  ['RadarChart', { title: 'Radar', data: samples.radar }],
  ['GaugeChart', { title: 'Gauge', data: samples.gauge }],
  ['HeatmapChart', { title: 'Heatmap', data: samples.heatmap }],
  ['TreemapChart', { title: 'Treemap', data: samples.treemap }],
  ['CandlestickChart', { title: 'Candles', data: samples.candlestick }],
  ['SankeyChart', { title: 'Flow', data: samples.sankey }],
];

describe('server rendering', () => {
  it('covers every exported component', () => {
    const components = Object.keys(lib).filter((name) => /^[A-Z]/.test(name));
    expect(cases.map(([name]) => name).sort()).toEqual(components.sort());
  });

  it.each(cases)('%s renders on the server', (name, props) => {
    const { body } = render(lib[name] as never, { props: props as never });
    expect(body).toContain(String(props.title ?? props.caption));
    expect(body).not.toContain('<canvas');
  });

  it('renders the description and data table on the server, where search engines see them', () => {
    const { body } = render(lib.BarChart, { props: { title: 'Bar', data: samples.category } });
    expect(body).toContain('Bar chart of 2 series');
    expect(body).toContain('<th scope="row"');
  });
});
