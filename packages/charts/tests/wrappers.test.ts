import { render, screen, waitFor } from '@testing-library/svelte';
import type { Component } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import BarChart from '../src/lib/components/BarChart.svelte';
import CandlestickChart from '../src/lib/components/CandlestickChart.svelte';
import FunnelChart from '../src/lib/components/FunnelChart.svelte';
import GaugeChart from '../src/lib/components/GaugeChart.svelte';
import HeatmapChart from '../src/lib/components/HeatmapChart.svelte';
import LineChart from '../src/lib/components/LineChart.svelte';
import PieChart from '../src/lib/components/PieChart.svelte';
import RadarChart from '../src/lib/components/RadarChart.svelte';
import SankeyChart from '../src/lib/components/SankeyChart.svelte';
import ScatterChart from '../src/lib/components/ScatterChart.svelte';
import TreemapChart from '../src/lib/components/TreemapChart.svelte';
import { setEChartsLoader } from '../src/lib/echarts.js';
import { createFakeECharts } from './fakes/echarts.js';
import { samples } from './fixtures.js';

let fake: ReturnType<typeof createFakeECharts>;

beforeEach(() => {
  fake = createFakeECharts();
  setEChartsLoader(() => fake.core);
});

const cases: Array<[string, Component<any>, unknown, string, string, RegExp]> = [
  ['LineChart', LineChart, samples.category, 'line', 'Category', /^Line chart of 2 series/],
  ['BarChart', BarChart, samples.category, 'bar', 'Category', /^Bar chart of 2 series/],
  ['PieChart', PieChart, samples.slices, 'pie', 'Name', /^Pie chart of 2 parts/],
  ['FunnelChart', FunnelChart, samples.slices, 'funnel', 'Name', /^Funnel chart of 2 stages/],
  [
    'ScatterChart',
    ScatterChart,
    samples.scatter,
    'scatter',
    'Series',
    /^Scatter chart of 2 points/,
  ],
  ['RadarChart', RadarChart, samples.radar, 'radar', 'Measure', /^Radar chart comparing/],
  ['GaugeChart', GaugeChart, samples.gauge, 'gauge', 'Reading', /^Gauge reading 72/],
  ['HeatmapChart', HeatmapChart, samples.heatmap, 'heatmap', 'Row', /^Heatmap of 2 rows/],
  ['TreemapChart', TreemapChart, samples.treemap, 'treemap', 'Item', /^Treemap of 2 groups/],
  [
    'CandlestickChart',
    CandlestickChart,
    samples.candlestick,
    'candlestick',
    'Date',
    /^Candlestick chart of 2/,
  ],
  ['SankeyChart', SankeyChart, samples.sankey, 'sankey', 'From', /^Flow diagram of 1 flows/],
];

describe.each(cases)('%s', (name, Wrapper, data, type, firstColumn, description) => {
  it('draws its chart type, describes it and tabulates it', async () => {
    render(Wrapper, { title: name, data });
    expect(screen.getByRole('img', { name })).toHaveAccessibleDescription(description);
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveTextContent(firstColumn);
    await waitFor(() => expect(fake.instances[0]?.calls.length).toBeGreaterThan(0));
    const series = fake.instances[0].option.series as Array<{ type: string }>;
    expect(series[0].type).toBe(type);
    // Only this chart's modules are registered, on top of the shared base.
    expect(fake.used.length).toBeLessThan(15);
  });

  it('keeps a description it is given', () => {
    render(Wrapper, { title: name, data, description: 'Mine.' });
    expect(screen.getByRole('img')).toHaveAccessibleDescription('Mine.');
  });
});

describe('empty data', () => {
  it.each([
    ['LineChart', LineChart, { categories: [], series: [] }],
    ['BarChart', BarChart, { categories: ['a'], series: [] }],
    ['PieChart', PieChart, [{ name: 'Zero', value: 0 }]],
    ['FunnelChart', FunnelChart, []],
    ['ScatterChart', ScatterChart, [{ name: 'None', data: [] }]],
    ['RadarChart', RadarChart, { indicators: [], series: [] }],
    ['HeatmapChart', HeatmapChart, { x: [], y: [], values: [] }],
    ['TreemapChart', TreemapChart, []],
    ['CandlestickChart', CandlestickChart, []],
    ['SankeyChart', SankeyChart, { nodes: [], links: [] }],
  ] as Array<[string, Component<any>, unknown]>)(
    '%s shows the empty state',
    (_name, Wrapper, data) => {
      render(Wrapper, { title: 'Nothing', data });
      expect(screen.getByText('No data to show')).toBeInTheDocument();
      expect(screen.queryByRole('img')).toBeNull();
    }
  );

  it('lets the caller decide when a gauge is empty', () => {
    render(GaugeChart, { title: 'Idle', data: { value: 0 }, empty: true });
    expect(screen.getByText('No data to show')).toBeInTheDocument();
  });
});

describe('wrapper options', () => {
  it('passes options through to the builder and labels to the table', async () => {
    render(LineChart, {
      title: 'Area',
      data: samples.category,
      area: true,
      categoryLabel: 'Month',
      valueFormat: { style: 'percent' },
      dataTable: 'visible',
    });
    expect(screen.getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '400%' })).toBeInTheDocument();
    await waitFor(() => expect(fake.instances[0]?.calls.length).toBeGreaterThan(0));
    const series = fake.instances[0].option.series as Array<{ areaStyle?: unknown }>;
    expect(series[0].areaStyle).toBeDefined();
  });

  it('labels the table columns of the fixed-shape charts', () => {
    render(SankeyChart, {
      title: 'Flow',
      data: samples.sankey,
      tableLabels: { sourceLabel: 'In' },
    });
    expect(screen.getByRole('columnheader', { name: 'In' })).toBeInTheDocument();
  });
});
