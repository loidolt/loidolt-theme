<script lang="ts">
  import { Pagination as PaginationPrimitive } from 'bits-ui';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** Total number of items being paged through — not the number of pages. */
    count: number;
    perPage?: number;
    /** 1-based current page. */
    page?: number;
    /** Pages kept either side of the current one before the trail turns into an ellipsis. */
    siblingCount?: number;
    /** Accessible name of the landmark. */
    label?: string;
    previousLabel?: string;
    nextLabel?: string;
    /** Accessible name for a page button, e.g. `(page) => `Page ${page}``. */
    pageLabel?: (page: number) => string;
    onPageChange?: (page: number) => void;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    count,
    perPage = 10,
    page = $bindable(1),
    siblingCount = 1,
    label = 'Pagination',
    previousLabel = 'Previous',
    nextLabel = 'Next',
    pageLabel = (value: number) => `Page ${value}`,
    onPageChange,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!--
  Bits' Root is a `<div>`; the landmark is ours, so the control set is reachable as "Pagination"
  from a rotor without the page having to add one.
-->
<nav bind:this={ref} class={cx('ldt-pagination', className)} aria-label={label} {...rest}>
  <PaginationPrimitive.Root
    {count}
    {perPage}
    {siblingCount}
    bind:page
    onPageChange={(next) => onPageChange?.(next)}
    class="ldt-pagination__list"
  >
    {#snippet children({ pages, currentPage })}
      <PaginationPrimitive.PrevButton class="ldt-button ldt-button--quiet ldt-button--sm"
        >{previousLabel}</PaginationPrimitive.PrevButton
      >
      {#each pages as item (item.key)}
        {#if item.type === 'ellipsis'}
          <!-- Presentational: the gap is a rendering device, and "…" read aloud between page
               numbers is noise. The page buttons either side already say where the trail jumps. -->
          <span class="ldt-pagination__ellipsis" aria-hidden="true">…</span>
        {:else}
          <!--
            Rendered through Bits' `child` snippet rather than as a styled primitive: the
            primitive merges its own `aria-label` last and would overwrite `pageLabel`. Spreading
            `props` first leaves its behaviour intact while the naming stays ours.
          -->
          <PaginationPrimitive.Page page={item}>
            {#snippet child({ props })}
              <button
                {...props}
                class="ldt-button ldt-button--quiet ldt-button--sm ldt-pagination__page"
                aria-label={pageLabel(item.value)}
                aria-current={item.value === currentPage ? 'page' : undefined}>{item.value}</button
              >
            {/snippet}
          </PaginationPrimitive.Page>
        {/if}
      {/each}
      <PaginationPrimitive.NextButton class="ldt-button ldt-button--quiet ldt-button--sm"
        >{nextLabel}</PaginationPrimitive.NextButton
      >
    {/snippet}
  </PaginationPrimitive.Root>
</nav>
