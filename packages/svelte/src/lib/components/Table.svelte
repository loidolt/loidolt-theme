<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLTableAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLTableAttributes {
    /** Names the table and its scroll region. */
    caption?: string;
    /** Accessible name for the scroll region when there is no `caption`. */
    regionLabel?: string;
    /**
     * Pins the header row while the body scrolls. Needs a bounded scroll container — set
     * `--ldt-table-height` on the wrapper, or the page scrolls instead and nothing sticks.
     */
    sticky?: boolean;
    /**
     * Rendered in place of the rows, as a single full-width cell. Pass it only when there is
     * nothing to show — `empty={rows.length === 0 ? nothingYet : undefined}` — since the
     * component cannot see inside `children` to count rows.
     */
    empty?: Snippet;
    /** Columns the empty cell spans. Defaults to the whole row. */
    columns?: number;
    /** `class` lands on the `<table>`; use `wrapperClass` for the scroll container. */
    class?: string;
    wrapperClass?: string;
    children: Snippet;
    ref?: HTMLTableElement | null;
    wrapperRef?: HTMLDivElement | null;
  }

  let {
    caption,
    regionLabel = 'Data table',
    sticky = false,
    empty,
    columns,
    class: className,
    wrapperClass,
    children,
    ref = $bindable(null),
    wrapperRef = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!-- `tabindex` is required: a scrollable region is unreachable by keyboard without it. -->
<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
<div
  bind:this={wrapperRef}
  class={cx('ldt-table-wrap', sticky && 'ldt-table-wrap--sticky', wrapperClass)}
  role="region"
  tabindex="0"
  aria-label={caption ?? regionLabel}
>
  <table
    bind:this={ref}
    class={cx('ldt-table', sticky && 'ldt-table--sticky', className)}
    {...rest}
  >
    {#if caption}<caption class="ldt-sr-only">{caption}</caption
      >{/if}{@render children()}{#if empty}<tbody class="ldt-table__empty">
        <tr>
          <!-- `colspan` defaults to the row-spanning maximum so the cell never leaves a gap
               beside it, whatever the column count turns out to be. -->
          <td colspan={columns ?? 1000}>{@render empty()}</td>
        </tr>
      </tbody>{/if}
  </table>
</div>
