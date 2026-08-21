<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /** Accessible name. Pass `undefined` when an adjacent label already announces the wait. */
    label?: string;
    class?: string;
    ref?: HTMLSpanElement | null;
  }

  let { label = 'Loading', class: className, ref = $bindable(null), ...rest }: Props = $props();
</script>

<span
  bind:this={ref}
  class={cx('ldt-spinner', className)}
  role={label ? 'status' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  {...rest}
></span>
