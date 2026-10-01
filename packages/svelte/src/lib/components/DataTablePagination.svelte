<script lang="ts" generics="T">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { DataTableState } from '../data-table.svelte.js';
  import { cx } from '../utils.js';
  import Pagination from './Pagination.svelte';
  import Select from './Select.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    table: DataTableState<T>;
    /** Choices for rows per page. An empty list hides the picker. */
    pageSizes?: number[];
    pageSizeLabel?: string;
    /** The status line, e.g. "11–20 of 48 · 3 selected". */
    summary?: (range: { from: number; to: number; total: number; selected: number }) => string;
    /** Accessible name of the page navigation. */
    label?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    table,
    pageSizes = [10, 25, 50, 100],
    pageSizeLabel = 'Rows per page',
    summary = ({ from, to, total, selected }) =>
      `${total === 0 ? 0 : `${from}–${to}`} of ${total}${selected ? ` · ${selected} selected` : ''}`,
    label = 'Table pages',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const pageId = $props.id();
  const from = $derived(table.rowCount === 0 ? 0 : (table.page - 1) * table.pageSize + 1);
  const to = $derived(Math.min(table.rowCount, table.page * table.pageSize));
  const sizes = $derived(
    [...new Set([...pageSizes, ...(Number.isFinite(table.pageSize) ? [table.pageSize] : [])])].sort(
      (a, b) => a - b
    )
  );
</script>

<div bind:this={ref} class={cx('ldt-data-table-pagination', className)} {...rest}>
  <!-- Polite, so a screen reader hears the new range after paging or filtering. -->
  <p class="ldt-data-table-pagination__summary" role="status">
    {summary({ from, to, total: table.rowCount, selected: table.selectedCount })}
  </p>
  {#if sizes.length && Number.isFinite(table.pageSize)}
    <div class="ldt-data-table-pagination__size">
      <label for={pageId}>{pageSizeLabel}</label>
      <Select
        id={pageId}
        value={String(table.pageSize)}
        options={sizes.map((size) => ({ value: String(size), label: String(size) }))}
        onValueChange={(value) => table.setPageSize(Number(value))}
      />
    </div>
  {/if}
  {#if table.pageCount > 1}
    <Pagination
      {label}
      count={table.rowCount}
      perPage={table.pageSize}
      page={table.page}
      onPageChange={(page) => table.setPage(page)}
    />
  {/if}
</div>
