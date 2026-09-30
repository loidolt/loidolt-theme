<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildFunnelOption,
    describeFunnel,
    sliceTable,
    type FunnelOptions,
  } from '../core/builders/slices.js';
  import type { SliceDatum } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, FunnelOptions {
    /** The stages, in order. */
    data: SliceDatum[];
    /** Headings of the data table columns. */
    tableLabels?: { nameLabel?: string; valueLabel?: string; shareLabel?: string };
  }

  let {
    data,
    sort,
    orientation,
    showLabels,
    showTooltip,
    valueFormat,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ sort, orientation, showLabels, showTooltip, valueFormat });
  const extensions = () => import('../echarts/funnel.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildFunnelOption(data, options, colors)}
  table={sliceTable(data, tableLabels)}
  description={description ?? describeFunnel(data, valueFormat)}
  empty={empty ?? data.length === 0}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
