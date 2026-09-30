<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildLineOption,
    describeLine,
    categoryTable,
    type LineOptions,
  } from '../core/builders/category.js';
  import type { CategoryData } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, LineOptions {
    /** Categories along the x axis and a series of values for each. */
    data: CategoryData;
    /** Heading of the first column in the data table. */
    categoryLabel?: string;
  }

  let {
    data,
    area,
    smooth,
    stacked,
    showPoints,
    showLegend,
    showTooltip,
    showGrid,
    valueFormat,
    categoryAxisName,
    valueAxisName,
    categoryLabel = 'Category',
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({
    area,
    smooth,
    stacked,
    showPoints,
    showLegend,
    showTooltip,
    showGrid,
    valueFormat,
    categoryAxisName,
    valueAxisName,
  });
  const extensions = () => import('../echarts/line.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildLineOption(data, options, colors)}
  table={categoryTable(data, categoryLabel)}
  description={description ?? describeLine(data, valueFormat)}
  empty={empty ?? (data.series.length === 0 || data.categories.length === 0)}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
