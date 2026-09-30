<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import {
    buildRadarOption,
    describeRadar,
    radarTable,
    type RadarOptions,
  } from '../core/builders/more.js';
  import type { RadarData } from '../core/types.js';
  import Chart from './Chart.svelte';

  type ChartProps = Omit<ComponentProps<typeof Chart>, 'option' | 'table' | 'extensions'>;

  interface Props extends ChartProps, RadarOptions {
    /** The spokes, and each series' value on every spoke. */
    data: RadarData;
    /** Heading of the first column in the data table. */
    indicatorLabel?: string;
  }

  let {
    data,
    shape,
    area,
    showLegend,
    showTooltip,
    indicatorLabel = 'Measure',
    description,
    empty,
    instance = $bindable(null),
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const options = $derived({ shape, area, showLegend, showTooltip });
  const extensions = () => import('../echarts/radar.js').then((module) => module.default);
</script>

<Chart
  bind:instance
  bind:ref
  option={(colors) => buildRadarOption(data, options, colors)}
  table={radarTable(data, indicatorLabel)}
  description={description ?? describeRadar(data)}
  empty={empty ?? (data.series.length === 0 || data.indicators.length === 0)}
  {extensions}
  {...rest}
/>
