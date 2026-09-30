<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildTreemapOption,
    describeTreemap,
    treemapTable,
    type TreemapOptions,
  } from '../core/builders/more.js';
  import type { TreeNode } from '../core/types.js';
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
  const extensions = () => import('../echarts/treemap.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildTreemapOption(data, options, colors)}
  table={treemapTable(data, tableLabels)}
  description={description ?? describeTreemap(data, valueFormat)}
  empty={empty ?? data.length === 0}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
