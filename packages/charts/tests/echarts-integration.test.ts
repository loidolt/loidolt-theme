import { render, waitFor } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import Chart from '../src/lib/components/Chart.svelte';
import type { EChartsInstance } from '../src/lib/echarts.js';

type Real = EChartsInstance & { getOption(): { series: unknown[]; color: string[] } };

/**
 * Against the real library, drawing to SVG (jsdom has no canvas). The fake cannot prove the
 * one thing that matters most here: that a series removed from the data leaves the chart.
 */
describe('with real ECharts', () => {
  it('drops removed series and recolours in place', async () => {
    const onReady = vi.fn();
    const { rerender } = render(Chart, {
      title: 'Real',
      renderer: 'svg',
      animation: false,
      onReady,
      option: {
        xAxis: { type: 'category', data: ['a', 'b'] },
        yAxis: { type: 'value' },
        series: [
          { type: 'bar', name: 'One', data: [1, 2] },
          { type: 'bar', name: 'Two', data: [3, 4] },
        ],
      },
    });
    await waitFor(() => expect(onReady).toHaveBeenCalled(), { timeout: 5000 });
    const chart = onReady.mock.calls[0][0] as Real;
    await waitFor(() => expect(chart.getOption().series).toHaveLength(2));

    await rerender({
      option: {
        xAxis: { type: 'category', data: ['a', 'b'] },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', name: 'One', data: [1, 2] }],
      },
    });
    await waitFor(() => expect(chart.getOption().series).toHaveLength(1));
    expect(chart.getOption().color[0]).toBe('#c65224');
  }, 15_000);
});
