<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildGaugeOption,
    describeGauge,
    gaugeTable,
    type GaugeOptions,
    type GaugeData,
  } from '../core/builders/more.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, GaugeOptions {
    /** The reading, and the scale it sits on (0–100 unless given). */
    data: GaugeData;
    /** Headings of the data table columns. */
    tableLabels?: {
      readingLabel?: string;
      valueLabel?: string;
      minLabel?: string;
      maxLabel?: string;
    };
  }

  let {
    data,
    splitNumber,
    showProgress,
    valueFormat,
    label,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ splitNumber, showProgress, valueFormat, label });
  const extensions = () => import('../echarts/gauge.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildGaugeOption(data, options, colors)}
  table={gaugeTable(data, tableLabels)}
  description={description ?? describeGauge(data, valueFormat)}
  {empty}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
