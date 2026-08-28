<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** 0-based position in the set; `format` receives it 1-based. */
    index: number;
    total: number;
    onPrevious?: () => void;
    onNext?: () => void;
    label?: string;
    previousLabel?: string;
    nextLabel?: string;
    format?: (n: number, total: number) => string;
    disabled?: boolean;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    index,
    total,
    onPrevious,
    onNext,
    label = 'Records',
    previousLabel = 'Previous',
    nextLabel = 'Next',
    format = (n, t) => `${n} of ${t}`,
    disabled = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div
  bind:this={ref}
  class={cx('ldt-record-stepper', className)}
  role="group"
  aria-label={label}
  {...rest}
>
  <button
    type="button"
    class="ldt-button ldt-button--text ldt-button--sm"
    disabled={disabled || index <= 0}
    onclick={() => onPrevious?.()}>{previousLabel}</button
  >
  <span class="ldt-record-stepper__count ldt-utility-text" aria-live="polite"
    >{format(index + 1, total)}</span
  >
  <button
    type="button"
    class="ldt-button ldt-button--text ldt-button--sm"
    disabled={disabled || index >= total - 1}
    onclick={() => onNext?.()}>{nextLabel}</button
  >
</div>
