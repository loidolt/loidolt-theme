<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ControlSize, StatusVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Omit (or pass `undefined`) for an indeterminate bar. */
    value?: number;
    max?: number;
    label?: string;
    /** Colours the bar by outcome — `success` when done, `error` when a run failed part-way. */
    variant?: 'default' | StatusVariant;
    /** Bar thickness. */
    size?: ControlSize;
    /** Show the formatted value after the bar. */
    showValue?: boolean;
    /**
     * Text for the value, shown by `showValue` and spoken as `aria-valuetext` — "3 of 12 sheets"
     * says more than 25%. Defaults to a whole percentage.
     */
    formatValue?: (value: number, max: number) => string;
    /** Lands on the progressbar element. */
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    value,
    max = 100,
    label = 'Progress',
    variant = 'default',
    size = 'md',
    showValue = false,
    formatValue,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const indeterminate = $derived(value === undefined || !Number.isFinite(value));
  // A non-positive `max` would make every ratio Infinity or NaN.
  const safeMax = $derived(Number.isFinite(max) && max > 0 ? max : 100);
  const clamped = $derived(Math.max(0, Math.min(safeMax, value ?? 0)));
  const text = $derived(
    indeterminate
      ? undefined
      : formatValue
        ? formatValue(clamped, safeMax)
        : `${Math.round((clamped / safeMax) * 100)}%`
  );
</script>

{#snippet bar()}
  <div
    bind:this={ref}
    class={cx(
      'ldt-progress',
      indeterminate && 'ldt-progress--indeterminate',
      variant !== 'default' && `ldt-progress--${variant}`,
      size !== 'md' && `ldt-progress--${size}`,
      className
    )}
    role="progressbar"
    aria-label={label}
    aria-valuenow={indeterminate ? undefined : clamped}
    aria-valuemin="0"
    aria-valuemax={safeMax}
    aria-valuetext={formatValue ? text : undefined}
    {...rest}
  >
    <div
      class="ldt-progress__bar"
      style:--ldt-progress-value={indeterminate ? undefined : clamped / safeMax}
    ></div>
  </div>
{/snippet}

{#if showValue}
  <div class="ldt-progress-field">
    {@render bar()}
    <!-- The progressbar already reports its value; this is the sighted copy. -->
    <span class="ldt-progress-field__value" aria-hidden="true">{text ?? ''}</span>
  </div>
{:else}
  {@render bar()}
{/if}
