<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Corner of the nearest positioned ancestor to pin to. */
    placement?: 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
    orientation?: Orientation;
    /** Accessible name; renders `role="group"` when set. */
    label?: string;
    children: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    placement = 'bottom-end',
    orientation = 'horizontal',
    label,
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!-- The parent supplies position: relative — the bar is a pointer-events island over a stage. -->
<div
  bind:this={ref}
  class={cx(
    'ldt-floating-bar',
    `ldt-floating-bar--${placement}`,
    orientation === 'vertical' && 'ldt-floating-bar--vertical',
    className
  )}
  role={label ? 'group' : undefined}
  aria-label={label}
  {...rest}
>
  {@render children()}
</div>
