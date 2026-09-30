<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildScatterOption,
    describeScatter,
    scatterTable,
    type ScatterOptions,
  } from '../core/builders/more.js';
  import type { ScatterSeries } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, ScatterOptions {
    /** One or more series of `[x, y]` points. */
    data: ScatterSeries[];
    /** Headings of the data table columns. */
    tableLabels?: { seriesLabel?: string; xLabel?: string; yLabel?: string };
  }

  let {
    data,
    showTrendLine,
    symbolSize,
    showLegend,
    showTooltip,
    xAxisName,
    yAxisName,
    xFormat,
    yFormat,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({
    showTrendLine,
    symbolSize,
    showLegend,
    showTooltip,
    xAxisName,
    yAxisName,
    xFormat,
    yFormat,
  });
  const extensions = () => import('../echarts/scatter.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildScatterOption(data, options, colors)}
  table={scatterTable(data, tableLabels)}
  description={description ?? describeScatter(data)}
  empty={empty ?? data.every((series) => series.data.length === 0)}
  {extensions}
  {...rest}
/>
