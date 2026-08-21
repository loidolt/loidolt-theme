<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Omit (or pass `undefined`) for an indeterminate bar. */
    value?: number;
    max?: number;
    label?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    value,
    max = 100,
    label = 'Progress',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const indeterminate = $derived(value === undefined || !Number.isFinite(value));
  // A non-positive `max` would make every ratio Infinity or NaN.
  const safeMax = $derived(Number.isFinite(max) && max > 0 ? max : 100);
  const clamped = $derived(Math.max(0, Math.min(safeMax, value ?? 0)));
</script>

<div
  bind:this={ref}
  class={cx('ldt-progress', indeterminate && 'ldt-progress--indeterminate', className)}
  role="progressbar"
  aria-label={label}
  aria-valuenow={indeterminate ? undefined : clamped}
  aria-valuemin="0"
  aria-valuemax={safeMax}
  {...rest}
>
  <div
    class="ldt-progress__bar"
    style:--ldt-progress-value={indeterminate ? undefined : clamped / safeMax}
  ></div>
</div>
