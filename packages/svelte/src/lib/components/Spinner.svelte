<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ControlSize } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** Accessible name. Pass `undefined` when an adjacent label already announces the wait. */
    label?: string;
    /** Omit to follow the surrounding font size, which suits a spinner inside a button. */
    size?: ControlSize;
    class?: string;
    ref?: HTMLSpanElement | null;
  }

  let {
    label = 'Loading',
    size,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<span
  bind:this={ref}
  class={cx('ldt-spinner', size && `ldt-spinner--${size}`, className)}
  role={label ? 'status' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  {...rest}
></span>
