<script lang="ts" generics="T">
  import type { Snippet } from 'svelte';
  import type { HTMLTableAttributes } from 'svelte/elements';
  import type { DataTableRow, DataTableState } from '../data-table.svelte.js';
  import EditableCell from '../internal/EditableCell.svelte';
  import Checkbox from './Checkbox.svelte';
  import EmptyState from './EmptyState.svelte';
  import Skeleton from './Skeleton.svelte';
  import Table from './Table.svelte';
  import TableHeader from './TableHeader.svelte';

  interface Props extends Omit<HTMLTableAttributes, 'children'> {
    /** The state from `createDataTable()`. */
    table: DataTableState<T>;
    caption?: string;
    regionLabel?: string;
    /** Pin the header row. Needs `--ldt-table-height` on the wrapper. */
    sticky?: boolean;
    /** Show placeholder rows while data is on its way. */
    loading?: boolean;
    loadingRows?: number;
    /** Shown when no rows remain. Defaults to an `EmptyState` from `emptyTitle`. */
    empty?: Snippet;
    emptyTitle?: string;
    emptyDescription?: string;
    /** Render each row yourself. Receives the row; output a whole `<tr>`. */
    row?: Snippet<[DataTableRow<T>]>;
    /** Accessible name of a row's selection control. */
    selectLabel?: (row: T) => string;
    selectAllLabel?: string;
    /**
     * Render only the rows scrolled into view — for thousands of rows on one page. Every row must
     * be `rowHeight` pixels tall, and the wrapper needs `--ldt-table-height` (with `sticky`).
     */
    virtual?: { rowHeight: number; overscan?: number };
    /** Called when an `editable` cell is saved. Update your data in response. */
    onCellEdit?: (row: T, columnId: string, value: string) => void;
    editLabel?: (header: string) => string;
    /** `class` lands on the `<table>`; `wrapperClass` on the scroll container. */
    class?: string;
    wrapperClass?: string;
    ref?: HTMLTableElement | null;
    wrapperRef?: HTMLDivElement | null;
  }

  let {
    table,
    caption,
    regionLabel,
    sticky = false,
    loading = false,
    loadingRows = 5,
    empty,
    emptyTitle = 'No results',
    emptyDescription,
    row: rowSnippet,
    selectLabel = () => 'Select row',
    selectAllLabel = 'Select all rows on this page',
    virtual,
    onCellEdit,
    editLabel = (header) => `Edit ${header}`,
    class: className,
    wrapperClass,
    ref = $bindable(null),
    wrapperRef = $bindable(null),
    ...rest
  }: Props = $props();

  const generatedName = $props.id();
  const selectable = $derived(table.selection !== 'none');
  const columnCount = $derived(table.columns.length + (selectable ? 1 : 0));
  // Rows before this page, so aria-rowindex counts from the top of the whole result.
  const offset = $derived(
    table.rows.length === table.rowCount ? 0 : (table.page - 1) * table.pageSize
  );
  const described = $derived(table.rows.length < table.rowCount);

  // Virtual window: which slice of the page's rows is in view, plus padding rows above and below.
  let scrollTop = $state(0);
  let viewport = $state(0);
  $effect(() => {
    if (!virtual || !wrapperRef) return;
    const node = wrapperRef;
    const measure = () => {
      scrollTop = node.scrollTop;
      viewport = node.clientHeight;
    };
    measure();
    node.addEventListener('scroll', measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => {
      node.removeEventListener('scroll', measure);
      observer.disconnect();
    };
  });
  const windowed = $derived.by(() => {
    const all = table.rows;
    if (!virtual) return { rows: all, start: 0, before: 0, after: 0 };
    const { rowHeight, overscan = 6 } = virtual;
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    // Before the wrapper has been measured (and on the server) render one screenful.
    const visible = Math.ceil((viewport || rowHeight * 20) / rowHeight) + overscan * 2;
    const end = Math.min(all.length, start + visible);
    return {
      rows: all.slice(start, end),
      start,
      before: start * rowHeight,
      after: (all.length - end) * rowHeight,
    };
  });
</script>

{#snippet nothing()}
  {#if empty}{@render empty()}{:else}<EmptyState
      title={emptyTitle}
      description={emptyDescription}
    />{/if}
{/snippet}

{#snippet selectCell(item: DataTableRow<T>)}
  <td class="ldt-data-table__select">
    {#if table.selection === 'multiple'}
      <Checkbox
        checked={item.selected}
        disabled={!table.isSelectable(item)}
        aria-label={selectLabel(item.original)}
        onCheckedChange={(checked) => table.select(item.id, checked)}
      />
    {:else}
      <input
        type="radio"
        class="ldt-data-table__radio"
        name={generatedName}
        checked={item.selected}
        disabled={!table.isSelectable(item)}
        aria-label={selectLabel(item.original)}
        onchange={() => table.select(item.id, true)}
      />
    {/if}
  </td>
{/snippet}

<Table
  bind:ref
  bind:wrapperRef
  {caption}
  {regionLabel}
  {sticky}
  columns={columnCount}
  empty={!loading && table.rows.length === 0 ? nothing : undefined}
  class={className}
  wrapperClass={['ldt-data-table', wrapperClass].filter(Boolean).join(' ')}
  aria-busy={loading || undefined}
  aria-rowcount={described ? table.rowCount + 1 : undefined}
  {...rest}
>
  <thead>
    <tr aria-rowindex={described ? 1 : undefined}>
      {#if selectable}
        <th scope="col" class="ldt-data-table__select">
          {#if table.selection === 'multiple'}
            <Checkbox
              checked={table.allSelected}
              indeterminate={table.someSelected}
              aria-label={selectAllLabel}
              onCheckedChange={(checked) => table.toggleAll(checked)}
            />
          {:else}<span class="ldt-sr-only">{selectAllLabel}</span>{/if}
        </th>
      {/if}
      {#each table.columns as column (column.id)}
        <TableHeader
          sort={column.sortable ? table.sortOf(column.id) : undefined}
          onSort={column.sortable
            ? (direction) =>
                table.sortBy(column.id, direction === 'descending' ? 'descending' : 'ascending')
            : undefined}
          align={column.align}
          style={column.width ? `width: ${column.width}` : undefined}
          data-hide-below={column.hideBelow}>{column.header}</TableHeader
        >
      {/each}
    </tr>
  </thead>
  {#if loading}
    <tbody>
      {#each { length: loadingRows }, index (index)}
        <tr>
          {#each { length: columnCount }, cell (cell)}<td><Skeleton variant="text" /></td>{/each}
        </tr>
      {/each}
    </tbody>
  {:else if table.rows.length}
    <tbody>
      {#if windowed.before}<tr class="ldt-data-table__spacer" aria-hidden="true"
          ><td colspan={columnCount} style:height="{windowed.before}px"></td></tr
        >{/if}
      {#each windowed.rows as item, index (item.id)}
        {#if rowSnippet}
          {@render rowSnippet(item)}
        {:else}
          <tr
            data-selected={item.selected ? '' : undefined}
            aria-rowindex={described ? offset + windowed.start + index + 2 : undefined}
            style:height={virtual ? `${virtual.rowHeight}px` : undefined}
          >
            {#if selectable}{@render selectCell(item)}{/if}
            {#each table.columns as column (column.id)}
              <td data-align={column.align} data-hide-below={column.hideBelow}>
                {#if column.cell}{@render column.cell(
                    item.original
                  )}{:else if column.editable && onCellEdit}<EditableCell
                    value={table.format(item.original, column)}
                    label={editLabel(column.header)}
                    onCommit={(value) => onCellEdit(item.original, column.id, value)}
                  />{:else}{table.format(item.original, column)}{/if}
              </td>
            {/each}
          </tr>
        {/if}
      {/each}
      {#if windowed.after}<tr class="ldt-data-table__spacer" aria-hidden="true"
          ><td colspan={columnCount} style:height="{windowed.after}px"></td></tr
        >{/if}
    </tbody>
  {/if}
</Table>
