import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import Chart from '../src/lib/components/Chart.svelte';
import { loadECharts, setEChartsLoader } from '../src/lib/echarts.js';
import { createFakeECharts } from './fakes/echarts.js';

const table = {
  columns: ['Month', 'Cuts'],
  rows: [
    ['Jan', 4],
    ['Feb', null],
  ] as Array<Array<string | number | null>>,
};

let fake: ReturnType<typeof createFakeECharts>;

beforeEach(() => {
  fake = createFakeECharts();
  setEChartsLoader(() => fake.core);
});

const ready = async () => {
  await waitFor(() => expect(fake.instances.length).toBeGreaterThan(0));
  await waitFor(() => expect(fake.instances.at(-1)!.calls.length).toBeGreaterThan(0));
  return fake.instances.at(-1)!;
};

describe('Chart', () => {
  it('names the picture, describes it, and themes the option', async () => {
    render(Chart, {
      title: 'Cuts per month',
      description: 'Rising all year.',
      option: { series: [{ type: 'bar', data: [1, 2] }], xAxis: { type: 'category' }, tooltip: {} },
    });
    const picture = screen.getByRole('img', { name: 'Cuts per month' });
    expect(picture).toHaveAccessibleDescription('Rising all year.');

    const chart = await ready();
    expect(chart.element).toBe(picture);
    expect(chart.settings).toEqual({ renderer: 'canvas' });
    expect(fake.core.use).toHaveBeenCalled();
    const option = chart.option as Record<string, any>;
    expect(option.color).toEqual([
      semantic.chart1,
      semantic.chart2,
      semantic.chart3,
      semantic.chart4,
      semantic.chart5,
      semantic.chart6,
      semantic.chart7,
      semantic.chart8,
    ]);
    expect(option.xAxis.axisLabel.color).toBe(semantic.textMuted);
    expect(option.tooltip.className).toBe('ldt-chart-tooltip');
    expect(chart.calls[0].settings).toEqual({ notMerge: true, lazyUpdate: true });
  });

  it('replaces the option on update, so removed series leave the chart', async () => {
    const { rerender } = render(Chart, {
      title: 'Two series',
      option: { series: [{ type: 'line' }, { type: 'line' }] },
    });
    const chart = await ready();
    await rerender({ option: { series: [{ type: 'line' }] } });
    await waitFor(() => expect((chart.option.series as unknown[]).length).toBe(1));
    expect(chart.calls.at(-1)!.settings).toMatchObject({ notMerge: true });
  });

  it('merges when asked, still replacing series and datasets whole', async () => {
    render(Chart, { title: 'Merged', merge: true, option: { series: [] } });
    const chart = await ready();
    expect(chart.calls[0].settings).toEqual({
      replaceMerge: ['series', 'dataset'],
      lazyUpdate: true,
    });
  });

  it('rebuilds a function option from the dark palette when the theme flips', async () => {
    const option = vi.fn((colors: { categorical: string[] }) => ({
      series: [{ type: 'bar', itemStyle: { color: colors.categorical[0] } }],
    }));
    render(Chart, { title: 'Themed', option });
    const chart = await ready();
    expect((chart.option.series as any[])[0].itemStyle.color).toBe(semantic.chart1);

    document.documentElement.dataset.theme = 'dark';
    await waitFor(() =>
      expect((chart.option.series as any[])[0].itemStyle.color).toBe(darkSemantic.chart1)
    );
    // Recoloured in place: no second instance, no flash.
    expect(fake.instances).toHaveLength(1);
  });

  it('turns animation off for reduced motion and can pattern its fills', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      render(Chart, { title: 'Still', decal: true, option: {} });
      const chart = await ready();
      expect(chart.option.animation).toBe(false);
      expect(chart.option.aria).toMatchObject({ enabled: true, decal: { show: true } });
    } finally {
      window.matchMedia = original;
    }
  });

  it('reports clicks through the latest handler', async () => {
    const first = vi.fn();
    const second = vi.fn();
    const { rerender } = render(Chart, { title: 'Clicks', option: {}, onItemClick: first });
    const chart = await ready();
    await rerender({ onItemClick: second });
    chart.emit('click', {
      componentType: 'series',
      seriesName: 'Cuts',
      seriesIndex: 0,
      name: 'Jan',
      dataIndex: 0,
      value: 4,
    });
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledWith({
      componentType: 'series',
      seriesName: 'Cuts',
      seriesIndex: 0,
      name: 'Jan',
      dataIndex: 0,
      value: 4,
    });
    chart.emit('click', {});
    expect(second).toHaveBeenLastCalledWith(
      expect.objectContaining({ name: '', componentType: '' })
    );
  });

  it('exposes the instance, hands it to onReady, and disposes it on unmount', async () => {
    const onReady = vi.fn();
    const { unmount } = render(Chart, { title: 'Life', option: {}, onReady });
    const chart = await ready();
    expect(onReady).toHaveBeenCalledWith(chart);
    unmount();
    expect(chart.disposed).toBe(true);
  });

  it('makes a new instance for a new renderer', async () => {
    const { rerender } = render(Chart, { title: 'Renderer', option: {} });
    const first = await ready();
    await rerender({ renderer: 'svg' });
    await waitFor(() => expect(fake.instances).toHaveLength(2));
    expect(first.disposed).toBe(true);
    expect(fake.instances[1].settings).toEqual({ renderer: 'svg' });
  });

  it('resizes with its container', async () => {
    const observers: Array<() => void> = [];
    const original = globalThis.ResizeObserver;
    globalThis.ResizeObserver = class {
      constructor(callback: () => void) {
        observers.push(callback);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof ResizeObserver;
    try {
      render(Chart, { title: 'Resize', option: {} });
      const chart = await ready();
      observers.at(-1)!();
      await waitFor(() => expect(chart.resize).toHaveBeenCalled());
    } finally {
      globalThis.ResizeObserver = original;
    }
  });

  it('shows loading, error with retry, and empty states instead of the chart', async () => {
    const onRetry = vi.fn();
    const { rerender } = render(Chart, { title: 'States', option: {}, loading: true, table });
    expect(screen.getByRole('status')).toHaveTextContent('Loading chart');
    expect(screen.getByRole('figure')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.queryByRole('table')).toBeNull();

    await rerender({ loading: false, error: 'Server said no.', onRetry });
    expect(screen.getByRole('alert')).toHaveTextContent('Server said no.');
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();

    await rerender({ error: null, empty: true, emptyTitle: 'Nothing cut yet' });
    expect(screen.getByText('Nothing cut yet')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('keeps the data table for assistive tech by default', async () => {
    render(Chart, { title: 'Cuts', option: {}, table });
    const grid = screen.getByRole('table', { name: 'Cuts' });
    expect(grid).toHaveClass('ldt-sr-only');
    expect(screen.getByRole('columnheader', { name: 'Month' })).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'Jan' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '4' })).toHaveAttribute('data-align', 'end');
    expect(screen.getByRole('cell', { name: '—' })).toBeInTheDocument();
    expect(screen.queryByRole('region')).toBeNull();
  });

  it('puts the table behind a disclosure button in toggle mode', async () => {
    render(Chart, { title: 'Cuts', option: {}, table, dataTable: 'toggle' });
    const toggle = screen.getByRole('button', { name: 'Show data table' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('table')).toBeNull();
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(toggle).toHaveAccessibleName('Hide data table');
    const grid = screen.getByRole('table', { name: 'Cuts' });
    expect(grid.closest('[id]')?.id).toBe(toggle.getAttribute('aria-controls'));
  });

  it('shows the table always, or never, when asked', () => {
    const { rerender } = render(Chart, { title: 'Cuts', option: {}, table, dataTable: 'visible' });
    expect(screen.getByRole('region', { name: 'Cuts' })).toBeInTheDocument();
    void rerender({ dataTable: 'none' });
  });

  it('falls back to the table when ECharts cannot load', async () => {
    setEChartsLoader(() => {
      throw new Error('offline');
    });
    render(Chart, { title: 'Offline', option: {}, table, dataTable: 'toggle' });
    expect(await screen.findByText(/Charts could not be loaded/)).toBeInTheDocument();
    expect(screen.getByRole('table', { name: 'Offline' })).toBeVisible();
    expect(screen.getByRole('img', { hidden: true })).not.toBeVisible();
  });

  it('never disposes an instance it has not finished making', async () => {
    let release: (core: typeof fake.core) => void = () => {};
    setEChartsLoader(() => new Promise((resolve) => (release = resolve)));
    const { unmount } = render(Chart, { title: 'Late', option: {} });
    unmount();
    release(fake.core);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(fake.instances).toHaveLength(0);
  });
});

describe('loadECharts', () => {
  afterEach(() => setEChartsLoader(null));

  it('loads once and caches', async () => {
    const loader = vi.fn(() => fake.core);
    setEChartsLoader(loader);
    expect(await loadECharts()).toBe(fake.core);
    expect(await loadECharts()).toBe(fake.core);
    expect(loader).toHaveBeenCalledOnce();
  });

  it('loads the real core by default', async () => {
    setEChartsLoader(null);
    const core = await loadECharts();
    expect(typeof core?.init).toBe('function');
    expect(typeof core?.use).toBe('function');
  });
});
