<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildCandlestickOption,
    describeCandlestick,
    candlestickTable,
    type CandlestickOptions,
  } from '../core/builders/more.js';
  import type { CandlestickDatum } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, CandlestickOptions {
    /** One open, high, low and close per period, optionally with volume. */
    data: CandlestickDatum[];
    /** Headings of the data table columns. */
    tableLabels?: {
      dateLabel?: string;
      openLabel?: string;
      highLabel?: string;
      lowLabel?: string;
      closeLabel?: string;
      volumeLabel?: string;
    };
  }

  let {
    data,
    showVolume,
    zoom,
    showTooltip,
    upColor,
    downColor,
    valueFormat,
    tableLabels = {},
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ showVolume, zoom, showTooltip, upColor, downColor, valueFormat });
  const extensions = () => import('../echarts/candlestick.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildCandlestickOption(data, options, colors)}
  table={candlestickTable(data, tableLabels)}
  description={description ?? describeCandlestick(data, valueFormat)}
  empty={empty ?? data.length === 0}
  {extensions}
  tableFormat={valueFormat}
  {...rest}
/>
