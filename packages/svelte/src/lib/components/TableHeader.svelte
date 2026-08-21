<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLThAttributes } from 'svelte/elements';
  import type { ColumnAlign, SortDirection } from '../types.js';
  import { cx } from '../utils.js';

  // `align` is omitted from the base: the deprecated HTML attribute of that name takes
  // physical values (`left`/`right`), and this one is logical.
  interface Props extends Omit<HTMLThAttributes, 'children' | 'align'> {
    /**
     * Current sort state of this column. Drives `aria-sort` and the indicator; leave at `none`
     * for every column that is not the sorted one, so screen readers report a single sort.
     */
    sort?: SortDirection;
    /**
     * Makes the header a sort control. Called with the direction a press asks for: `ascending`
     * for an unsorted or descending column, `descending` for an ascending one.
     */
    onSort?: (direction: SortDirection) => void;
    align?: ColumnAlign;
    /** Accessible name of the sort button when the header's own text is not enough. */
    sortLabel?: string;
    class?: string;
    children: Snippet;
    ref?: HTMLTableCellElement | null;
  }

  let {
    sort = 'none',
    onSort,
    align,
    sortLabel,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // Two-state cycle. A third "unsorted" step reads as a broken control far more often than it
  // reads as a feature: the table has to be sorted *somehow*, so there is nothing to return to.
  const next = $derived<SortDirection>(sort === 'ascending' ? 'descending' : 'ascending');
</script>

<!--
  A `<th>` that can sort. `aria-sort` lives on the cell (where the spec puts it) while the
  press target is a real button inside it, so the column is reachable and announced by keyboard
  without turning the whole cell into a click surface.
-->
<th
  bind:this={ref}
  scope="col"
  class={cx('ldt-table__header', className)}
  data-align={align}
  aria-sort={onSort ? sort : undefined}
  {...rest}
>
  {#if onSort}
    <button
      type="button"
      class="ldt-table__sort"
      data-sort={sort}
      aria-label={sortLabel}
      onclick={() => onSort(next)}
    >
      {@render children()}
      <!-- Decorative: `aria-sort` already carries the state to assistive tech. -->
      <span class="ldt-table__sort-indicator" aria-hidden="true"></span>
    </button>
  {:else}
    {@render children()}
  {/if}
</th>
