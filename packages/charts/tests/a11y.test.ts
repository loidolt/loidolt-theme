import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { Component } from 'svelte';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import * as charts from '../src/lib/index.js';
import { createFakeECharts } from './fakes/echarts.js';
import { samples } from './fixtures.js';

beforeEach(() => {
  const fake = createFakeECharts();
  charts.setEChartsLoader(() => fake.core);
});

const table = {
  columns: ['Month', 'Cuts'],
  rows: [['Jan', 4]] as Array<Array<string | number | null>>,
};

describe('chart accessibility', () => {
  it('passes axe in every table mode', async () => {
    for (const dataTable of ['hidden', 'toggle', 'visible'] as const) {
      const { container, unmount } = render(charts.Chart, {
        title: `Cuts ${dataTable}`,
        description: 'Up.',
        option: {},
        table,
        dataTable,
      });
      if (dataTable === 'toggle') await userEvent.click(screen.getByRole('button'));
      expect((await axe(container)).violations).toEqual([]);
      unmount();
    }
  });

  it('passes axe in its loading, error and empty states', async () => {
    for (const state of [
      { loading: true },
      { error: 'Nope', onRetry: () => {} },
      { empty: true },
    ]) {
      const { container, unmount } = render(charts.Chart, { title: 'State', option: {}, ...state });
      expect((await axe(container)).violations).toEqual([]);
      unmount();
    }
  });

  it.each([
    ['LineChart', samples.category],
    ['BarChart', samples.category],
    ['PieChart', samples.slices],
    ['FunnelChart', samples.slices],
    ['ScatterChart', samples.scatter],
    ['RadarChart', samples.radar],
    ['GaugeChart', samples.gauge],
    ['HeatmapChart', samples.heatmap],
    ['TreemapChart', samples.treemap],
    ['CandlestickChart', samples.candlestick],
    ['SankeyChart', samples.sankey],
  ] as const)('%s passes axe', async (name, data) => {
    const Wrapper = charts[name] as Component<any>;
    const { container } = render(Wrapper, { title: name, data });
    expect((await axe(container)).violations).toEqual([]);
  });

  it('ChartDataTable passes axe on its own', async () => {
    const { container } = render(charts.ChartDataTable, { table, caption: 'Cuts' });
    expect((await axe(container)).violations).toEqual([]);
  });
});
