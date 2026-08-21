<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'min' | 'max' | 'step'> {
    value?: number;
    min?: number;
    max?: number;
    step?: number;
    /** Accessible name of the field; also used to name the two spin buttons. */
    label: string;
    decrementLabel?: (label: string) => string;
    incrementLabel?: (label: string) => string;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    onValueChange?: (value: number) => void;
    /** `class` lands on the wrapper; use `inputClass` to reach the input. */
    class?: string;
    inputClass?: string;
    ref?: HTMLInputElement | null;
  }

  let {
    value = $bindable(0),
    min = -Infinity,
    max = Infinity,
    step = 1,
    label,
    decrementLabel = (name) => `Decrease ${name}`,
    incrementLabel = (name) => `Increase ${name}`,
    boxed = false,
    onValueChange,
    class: className,
    inputClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  /** Clearing the input yields `NaN`; fall back to the low bound rather than wedging the field. */
  const fallback = $derived(Number.isFinite(min) ? min : 0);

  const atMin = $derived(value <= min);
  const atMax = $derived(value >= max);

  function set(next: number) {
    value = Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : fallback;
    onValueChange?.(value);
  }
</script>

<div class={cx('ldt-number-field', boxed && 'ldt-number-field--boxed', className)}>
  <button
    class="ldt-number-field__button"
    type="button"
    aria-label={decrementLabel(label)}
    aria-disabled={atMin || undefined}
    onclick={() => !atMin && set(value - step)}>−</button
  >
  <input
    bind:this={ref}
    class={cx('ldt-number-field__input', inputClass)}
    type="number"
    bind:value
    min={Number.isFinite(min) ? min : undefined}
    max={Number.isFinite(max) ? max : undefined}
    {step}
    aria-label={label}
    {...rest}
    onchange={(event) => set(Number(event.currentTarget.value))}
  />
  <button
    class="ldt-number-field__button"
    type="button"
    aria-label={incrementLabel(label)}
    aria-disabled={atMax || undefined}
    onclick={() => !atMax && set(value + step)}>+</button
  >
</div>
