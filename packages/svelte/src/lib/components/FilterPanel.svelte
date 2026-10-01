<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';
  import Button from './Button.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /**
     * Whether the panel is expanded. The toggle is yours — a `Button` with
     * `aria-expanded={open}` and `aria-controls` set to this panel's `id`.
     */
    open?: boolean;
    /** Accessible name of the region. */
    label?: string;
    /** How many filters are set; shows "Clear all" when above zero and `onClear` is given. */
    activeCount?: number;
    onClear?: () => void;
    clearLabel?: string;
    /** The filter controls, laid out on an auto-fit grid (`--ldt-min` sets the column width). */
    children: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  const generatedId = $props.id();

  let {
    open = $bindable(false),
    id = generatedId,
    label = 'Filters',
    activeCount = 0,
    onClear,
    clearLabel = 'Clear all',
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!--
  Collapsed with `inert`, not `display: none`, so the height can animate; `inert` still takes the
  hidden controls out of the tab order and the accessibility tree.
-->
<div
  bind:this={ref}
  {id}
  class={cx('ldt-filter-panel', className)}
  data-state={open ? 'open' : 'closed'}
  role="region"
  aria-label={label}
  {...rest}
>
  <div class="ldt-filter-panel__clip" inert={!open}>
    <div class="ldt-filter-panel__body">
      <div class="ldt-filter-panel__grid">{@render children()}</div>
      {#if onClear && activeCount > 0}<div class="ldt-filter-panel__footer">
          <Button variant="text" size="sm" onclick={onClear}>{clearLabel}</Button>
        </div>{/if}
    </div>
  </div>
</div>
