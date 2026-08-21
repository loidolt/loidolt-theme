<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLTableAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLTableAttributes {
    /** Names the table and its scroll region. */
    caption?: string;
    /** Accessible name for the scroll region when there is no `caption`. */
    regionLabel?: string;
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
  class={cx('ldt-table-wrap', wrapperClass)}
  role="region"
  tabindex="0"
  aria-label={caption ?? regionLabel}
>
  <table bind:this={ref} class={cx('ldt-table', className)} {...rest}>
    {#if caption}<caption class="ldt-sr-only">{caption}</caption>{/if}{@render children()}
  </table>
</div>
