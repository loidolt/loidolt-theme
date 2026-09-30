<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildSankeyOption,
    describeSankey,
    sankeyTable,
    type SankeyOptions,
  } from '../core/builders/more.js';
  import type { SankeyData } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, SankeyOptions {
    /** Named nodes and the flows between them. */
    data: SankeyData;
    /** Headings of the data table columns. */
    tableLabels?: { sourceLabel?: string; targetLabel?: string; valueLabel?: string };
  }

  let {
    data,
    orientation,
    showTooltip,
    valueFormat,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ orientation, showTooltip, valueFormat });
  const extensions = () => import('../echarts/sankey.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildSankeyOption(data, options, colors)}
  table={sankeyTable(data, tableLabels)}
  description={description ?? describeSankey(data, valueFormat)}
  empty={empty ?? data.links.length === 0}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
