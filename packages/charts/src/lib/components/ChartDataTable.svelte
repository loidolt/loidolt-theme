<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { Table, cx } from '@loidolt/theme-svelte';
  import { formatNumber, type FormatOptions } from '../core/format.js';
  import type { ChartCell, ChartTable } from '../core/types.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** The rows and columns, as the chart builders' `…Table()` helpers return them. */
    table: ChartTable;
    /** Names the table, usually the chart's title. */
    caption: string;
    /**
     * Present the table to assistive tech only. A chart's default: the picture is for the eye,
     * the table for everyone else, and neither gets in the other's way.
     */
    visuallyHidden?: boolean;
    /** How numbers are written. */
    valueFormat?: FormatOptions;
    /** Written in empty cells. */
    emptyCell?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    table,
    caption,
    visuallyHidden = false,
    valueFormat,
    emptyCell = '—',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const cell = (value: ChartCell) =>
    value == null
      ? emptyCell
      : typeof value === 'number'
        ? formatNumber(value, valueFormat)
        : value;
  const align = (value: ChartCell) => (typeof value === 'number' ? 'end' : undefined);
</script>

{#snippet contents()}
  <thead>
    <tr>
      {#each table.columns as column, index (index)}
        <th scope="col">{column}</th>
      {/each}
    </tr>
  </thead>
  <tbody>
    {#each table.rows as row, rowIndex (rowIndex)}
      <tr>
        {#each row as value, index (index)}
          {#if index === 0}
            <th scope="row" data-align={align(value)}>{cell(value)}</th>
          {:else}
            <td data-align={align(value)}>{cell(value)}</td>
          {/if}
        {/each}
      </tr>
    {/each}
  </tbody>
{/snippet}

<div bind:this={ref} class={cx('ldt-chart-table', className)} {...rest}>
  {#if visuallyHidden}
    <!-- Not the scrolling `Table`: a focusable region nobody can see would trap sighted
         keyboard users on an invisible stop. -->
    <table class="ldt-sr-only">
      <caption>{caption}</caption>
      {@render contents()}
    </table>
  {:else}
    <Table {caption}>{@render contents()}</Table>
  {/if}
</div>
