<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildPieOption,
    describePie,
    sliceTable,
    type PieOptions,
  } from '../core/builders/slices.js';
  import type { SliceDatum } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, PieOptions {
    /** The parts of the whole, one slice each. */
    data: SliceDatum[];
    /** Headings of the data table columns. */
    tableLabels?: { nameLabel?: string; valueLabel?: string; shareLabel?: string };
  }

  let {
    data,
    innerRadius,
    showLabels,
    labelPosition,
    showLegend,
    showTooltip,
    centerValue,
    centerLabel,
    valueFormat,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({
    innerRadius,
    showLabels,
    labelPosition,
    showLegend,
    showTooltip,
    centerValue,
    centerLabel,
    valueFormat,
  });
  const extensions = () => import('../echarts/pie.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildPieOption(data, options, colors)}
  table={sliceTable(data, tableLabels)}
  description={description ?? describePie(data, valueFormat)}
  empty={empty ?? (data.length === 0 || data.every((slice) => slice.value === 0))}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
