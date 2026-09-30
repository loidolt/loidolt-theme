<script lang="ts">
  import { untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { chartRoles } from '@loidolt/theme-tokens';
  import {
    Alert,
    Button,
    EmptyState,
    Skeleton,
    createMediaQuery,
    createTokenColors,
    cx,
  } from '@loidolt/theme-svelte';
  import type { FormatOptions } from '../core/format.js';
  import { applyTheme } from '../core/theme.js';
  import type { ChartItemEvent, ChartOptionSource, ChartTable } from '../core/types.js';
  import { loadECharts, type ChartExtensions, type EChartsInstance } from '../echarts.js';
  import ChartDataTable from './ChartDataTable.svelte';

  type TableMode = 'hidden' | 'toggle' | 'visible' | 'none';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
    /** Names the chart — its caption, and the accessible name of the picture. */
    title: string;
    /** Keep the caption for assistive tech only, when a heading nearby already names the chart. */
    hideTitle?: boolean;
    /**
     * What the chart shows, in a sentence or two, read after the title. The wrappers write one
     * from the data; say what matters most if you know better.
     */
    description?: string;
    /** An ECharts option, or a function of the theme colours that builds one. */
    option: ChartOptionSource;
    /** The data as a table: the chart's non-visual alternative. */
    table?: ChartTable;
    /**
     * How the table appears: `hidden` for assistive tech only, `toggle` behind a button,
     * `visible` always, `none` not at all.
     */
    dataTable?: TableMode;
    /** How numbers in the table are written. */
    tableFormat?: FormatOptions;
    showTableLabel?: string;
    hideTableLabel?: string;
    /** Chart height: pixels, or any CSS length. */
    height?: number | string;
    /** Shows a placeholder while the data is on its way. */
    loading?: boolean;
    loadingLabel?: string;
    /** Shows the message in place of the chart. */
    error?: string | null;
    errorTitle?: string;
    /** Offers a retry button with the error. */
    onRetry?: () => void;
    retryLabel?: string;
    /** Shows the empty state in place of the chart. The wrappers set it when there is no data. */
    empty?: boolean;
    emptyTitle?: string;
    emptyDescription?: string;
    /** Shown if ECharts itself cannot be loaded. */
    unavailableText?: string;
    /** `svg` stays crisp in print and at any zoom; `canvas` is faster with many points. */
    renderer?: 'canvas' | 'svg';
    /** Transitions. Always off when the user prefers reduced motion. */
    animation?: boolean;
    /** Patterns on fills, so series are told apart without relying on colour. */
    decal?: boolean;
    /**
     * Merge updates into the chart rather than replacing the option — keeps zoom and legend
     * state across data updates. Series and datasets are still replaced whole.
     */
    merge?: boolean;
    /**
     * The ECharts modules this chart draws with. Defaults to every chart type; the wrappers
     * pass only their own.
     */
    extensions?: ChartExtensions;
    /** A click on a data point, slice or node. */
    onItemClick?: (event: ChartItemEvent) => void;
    /** Called once the ECharts instance exists, for anything the props do not cover. */
    onReady?: (instance: EChartsInstance) => void;
    /** The live ECharts instance. Bindable; `null` until loaded. */
    instance?: EChartsInstance | null;
    class?: string;
    ref?: HTMLElement | null;
  }

  const id = $props.id();

  let {
    title,
    hideTitle = false,
    description,
    option,
    table,
    dataTable = 'hidden',
    tableFormat,
    showTableLabel = 'Show data table',
    hideTableLabel = 'Hide data table',
    height = 320,
    loading = false,
    loadingLabel = 'Loading chart',
    error = null,
    errorTitle = 'The chart could not be shown',
    onRetry,
    retryLabel = 'Try again',
    empty = false,
    emptyTitle = 'No data to show',
    emptyDescription,
    unavailableText = 'Charts could not be loaded. The data is in the table below.',
    renderer = 'canvas',
    animation = true,
    decal = false,
    merge = false,
    extensions = () => import('../echarts/all.js').then((module) => module.default),
    onItemClick,
    onReady,
    instance = $bindable(null),
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let surface = $state<HTMLDivElement | null>(null);
  let chart = $state.raw<EChartsInstance | null>(null);
  let unavailable = $state(false);
  let tableOpen = $state(false);

  const palette = createTokenColors(chartRoles, { element: () => ref });
  const reducedMotion = createMediaQuery('(prefers-reduced-motion: reduce)');

  const resolved = $derived(
    applyTheme(typeof option === 'function' ? option(palette.colors) : option, palette.colors, {
      animation: animation && !reducedMotion.matches,
      decal,
    })
  );

  const showChart = $derived(!loading && !error && !empty);
  const cssHeight = $derived(typeof height === 'number' ? `${height}px` : height);
  const [titleId, descriptionId, tableId] = [`${id}-title`, `${id}-description`, `${id}-table`];

  // Read the palette off the mounted figure, so a scoped theme around it applies.
  $effect(() => {
    if (ref) untrack(() => palette.refresh());
  });

  // Settled through a derived, so only an actual change of renderer re-creates the instance.
  const rendererMode = $derived(renderer);

  // One ECharts instance per mounted surface; a new renderer needs a new instance.
  $effect(() => {
    const element = surface;
    const mode = rendererMode;
    if (!element) return;
    const load = untrack(() => extensions);
    let disposed = false;
    let current: EChartsInstance | null = null;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (current && !current.isDisposed()) current.resize();
      });
    });
    observer.observe(element);

    void (async () => {
      const core = await loadECharts();
      const modules = core
        ? await Promise.all([import('../echarts/base.js').then((module) => module.default), load()])
        : null;
      if (disposed) return;
      if (!core || !modules) {
        unavailable = true;
        return;
      }
      core.use(modules.flat());
      current = core.init(element, null, { renderer: mode });
      // Handlers read the latest prop when they fire, so one registration serves every render.
      current.on('click', (params) =>
        onItemClick?.({
          componentType: String(params.componentType ?? ''),
          seriesName: params.seriesName as string | undefined,
          seriesIndex: params.seriesIndex as number | undefined,
          name: String(params.name ?? ''),
          dataIndex: params.dataIndex as number | undefined,
          value: params.value,
        })
      );
      unavailable = false;
      chart = current;
      instance = current;
      onReady?.(current);
    })();

    return () => {
      disposed = true;
      observer.disconnect();
      cancelAnimationFrame(frame);
      current?.dispose();
      chart = null;
      instance = null;
    };
  });

  // Replace, not merge, by default: series removed from the data must leave the chart too.
  $effect(() => {
    if (!chart) return;
    chart.setOption(
      resolved,
      merge
        ? { replaceMerge: ['series', 'dataset'], lazyUpdate: true }
        : { notMerge: true, lazyUpdate: true }
    );
  });
</script>

<figure
  bind:this={ref}
  class={cx('ldt-chart', className)}
  style:--ldt-chart-height={cssHeight}
  aria-busy={loading || undefined}
  {...rest}
>
  <figcaption id={titleId} class={cx('ldt-chart__title', hideTitle && 'ldt-sr-only')}>
    {title}
  </figcaption>

  {#if loading}
    <div class="ldt-chart__state">
      <Skeleton variant="block" height="100%" />
      <span class="ldt-sr-only" role="status">{loadingLabel}</span>
    </div>
  {:else if error}
    <Alert variant="error" title={errorTitle} class="ldt-chart__alert">
      <p>{error}</p>
      {#if onRetry}
        <Button size="sm" onclick={onRetry}>{retryLabel}</Button>
      {/if}
    </Alert>
  {:else if empty}
    <EmptyState title={emptyTitle} description={emptyDescription} class="ldt-chart__state" />
  {:else}
    {#if unavailable}
      <Alert variant="warning" class="ldt-chart__alert">{unavailableText}</Alert>
    {/if}
    <div
      bind:this={surface}
      class="ldt-chart__canvas"
      role="img"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      hidden={unavailable}
    ></div>
    {#if description}<p id={descriptionId} class="ldt-sr-only">{description}</p>{/if}
  {/if}

  {#if table && showChart && dataTable !== 'none'}
    {#if dataTable === 'toggle'}
      <Button
        size="sm"
        variant="quiet"
        class="ldt-chart__table-toggle"
        aria-expanded={tableOpen}
        aria-controls={tableId}
        onclick={() => (tableOpen = !tableOpen)}
      >
        {tableOpen ? hideTableLabel : showTableLabel}
      </Button>
    {/if}
    <ChartDataTable
      id={tableId}
      {table}
      caption={title}
      valueFormat={tableFormat}
      visuallyHidden={dataTable === 'hidden' && !unavailable}
      hidden={dataTable === 'toggle' && !tableOpen && !unavailable}
      class="ldt-chart__table"
    />
  {/if}
</figure>
