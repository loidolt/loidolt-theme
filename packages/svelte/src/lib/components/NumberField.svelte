<script lang="ts" generics="V extends number | null = number">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'min' | 'max' | 'step'> {
    /** A number, or `null` for an empty field when `nullable` is set. */
    value?: V;
    min?: number;
    max?: number;
    step?: number;
    /** Accessible name of the field; also used to name the two spin buttons. */
    label: string;
    decrementLabel?: (label: string) => string;
    incrementLabel?: (label: string) => string;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    /**
     * Let the field be empty: clearing it yields `null` instead of snapping to the low bound.
     * For optional quantities where "not set" differs from zero. Type `value` as
     * `number | null` to bind it.
     */
    nullable?: boolean;
    /** Hide the − and + buttons, for dense tables. The keyboard still steps with the arrows. */
    hideSteppers?: boolean;
    onValueChange?: (value: V) => void;
    /** `class` lands on the wrapper; use `inputClass` to reach the input. */
    class?: string;
    inputClass?: string;
    ref?: HTMLInputElement | null;
  }

  let {
    value = $bindable(0 as V),
    min = -Infinity,
    max = Infinity,
    step = 1,
    label,
    decrementLabel = (name) => `Decrease ${name}`,
    incrementLabel = (name) => `Increase ${name}`,
    boxed = false,
    nullable = false,
    hideSteppers = false,
    disabled = false,
    readonly = false,
    onValueChange,
    onchange,
    class: className,
    inputClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  /** Clearing the input yields `NaN`; fall back to the low bound rather than wedging the field. */
  const fallback = $derived(Number.isFinite(min) ? min : 0);

  const current = $derived(value === null ? null : (value as number));
  const atMin = $derived(current !== null && current <= min);
  const atMax = $derived(current !== null && current >= max);
  const locked = $derived(Boolean(disabled) || Boolean(readonly));

  function set(next: number) {
    value = (
      Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : nullable ? null : fallback
    ) as V;
    onValueChange?.(value);
  }

  // Stepping from an empty field starts at the low bound, the same place clearing lands.
  const nudge = (direction: 1 | -1) =>
    set((current ?? fallback) + (current === null ? 0 : step * direction));
</script>

<div
  class={cx(
    'ldt-number-field',
    boxed && 'ldt-number-field--boxed',
    hideSteppers && 'ldt-number-field--bare',
    className
  )}
>
  {#if !hideSteppers}<button
      class="ldt-number-field__button"
      type="button"
      {disabled}
      aria-label={decrementLabel(label)}
      aria-disabled={atMin || readonly || undefined}
      onclick={() => !atMin && !locked && nudge(-1)}>−</button
    >{/if}
  <input
    bind:this={ref}
    class={cx('ldt-number-field__input', inputClass)}
    type="number"
    bind:value={() => value, (next) => (value = next as V)}
    min={Number.isFinite(min) ? min : undefined}
    max={Number.isFinite(max) ? max : undefined}
    {step}
    {disabled}
    {readonly}
    aria-label={label}
    {...rest}
    onchange={(event) => {
      // `Number('')` is 0, not NaN — a cleared field must hit the documented fallback,
      // not silently clamp to zero.
      const raw = event.currentTarget.value;
      set(raw === '' ? NaN : Number(raw));
      onchange?.(event);
    }}
  />
  {#if !hideSteppers}<button
      class="ldt-number-field__button"
      type="button"
      {disabled}
      aria-label={incrementLabel(label)}
      aria-disabled={atMax || readonly || undefined}
      onclick={() => !atMax && !locked && nudge(1)}>+</button
    >{/if}
</div>
