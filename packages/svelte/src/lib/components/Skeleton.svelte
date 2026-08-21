<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** Number is treated as pixels; strings pass through as CSS. */
    width?: string | number;
    height?: string | number;
    class?: string;
    ref?: HTMLSpanElement | null;
  }

  let { width, height, class: className, ref = $bindable(null), ...rest }: Props = $props();

  const size = (value: string | number | undefined) =>
    typeof value === 'number' ? `${value}px` : value;
</script>

<span
  bind:this={ref}
  class={cx('ldt-skeleton', className)}
  style:width={size(width)}
  style:height={size(height)}
  aria-hidden="true"
  {...rest}
></span>
