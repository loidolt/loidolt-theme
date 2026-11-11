<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildTreemapOption,
    describeTreemap,
    treemapTable,
    type TreemapOptions,
  } from '../core/builders/more.js';
  import type { ChartOption, TreeNode } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, TreemapOptions {
    /** A tree of named values; a branch is the sum of its children. */
    data: TreeNode[];
    /** Headings of the data table columns. */
    tableLabels?: { pathLabel?: string; valueLabel?: string };
  }

  let {
    data,
    showTooltip,
    showBreadcrumb,
    valueFormat,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ showTooltip, showBreadcrumb, valueFormat });
  /*
   * ECharts names the breadcrumb's first stop after the series; unnamed, it draws an empty chevron.
   * The chart's own title is that name.
   */
  const named = (option: ChartOption): ChartOption =>
    rest.title
      ? {
          ...option,
          series: (option.series as object[]).map((series, index) =>
            index === 0 ? { ...series, name: rest.title } : series
          ),
        }
      : option;
  const extensions = () => import('../echarts/treemap.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => named(buildTreemapOption(data, options, colors))}
  table={treemapTable(data, tableLabels)}
  description={description ?? describeTreemap(data, valueFormat)}
  empty={empty ?? data.length === 0}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
