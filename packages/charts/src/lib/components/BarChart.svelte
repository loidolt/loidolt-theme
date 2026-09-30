<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildBarOption,
    describeBar,
    categoryTable,
    type BarOptions,
  } from '../core/builders/category.js';
  import type { CategoryData } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, BarOptions {
    /** Categories and a series of values for each. */
    data: CategoryData;
    /** Heading of the first column in the data table. */
    categoryLabel?: string;
  }

  let {
    data,
    orientation,
    stacked,
    showValues,
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
    orientation,
    stacked,
    showValues,
    showLegend,
    showTooltip,
    showGrid,
    valueFormat,
    categoryAxisName,
    valueAxisName,
  });
  const extensions = () => import('../echarts/bar.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildBarOption(data, options, colors)}
  table={categoryTable(data, categoryLabel)}
  description={description ?? describeBar(data, valueFormat)}
  empty={empty ?? (data.series.length === 0 || data.categories.length === 0)}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
