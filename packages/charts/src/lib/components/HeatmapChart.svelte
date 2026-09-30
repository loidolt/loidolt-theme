<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildHeatmapOption,
    describeHeatmap,
    heatmapTable,
    type HeatmapOptions,
  } from '../core/builders/more.js';
  import type { HeatmapData } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, HeatmapOptions {
    /** Column and row labels, and the value in each cell. */
    data: HeatmapData;
    /** Heading of the data table's first column, which holds the row labels. */
    cornerLabel?: string;
  }

  let {
    data,
    showValues,
    showTooltip,
    showScale,
    valueFormat,
    min,
    max,
    cornerLabel = 'Row',
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ showValues, showTooltip, showScale, valueFormat, min, max });
  const extensions = () => import('../echarts/heatmap.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildHeatmapOption(data, options, colors)}
  table={heatmapTable(data, cornerLabel)}
  description={description ?? describeHeatmap(data, valueFormat)}
  empty={empty ?? data.values.length === 0}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
