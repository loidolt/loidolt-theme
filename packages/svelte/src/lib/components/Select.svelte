<script lang="ts" generics="T extends string = string">
  import type { HTMLSelectAttributes } from 'svelte/elements';
  import type { Option } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLSelectAttributes, 'value'> {
    value?: T | '';
    options: Option<T>[];
    /**
     * Empty-choice text. Selectable again after a real choice unless the field is `required`,
     * so a user can undo their selection.
     */
    placeholder?: string;
    /** Accessible name when the select is not wrapped in a `Field` or `<label>`. */
    label?: string;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    onValueChange?: (value: T | '') => void;
    class?: string;
    ref?: HTMLSelectElement | null;
  }

  let {
    value = $bindable(''),
    options,
    placeholder,
    label,
    boxed = false,
    required = false,
    onValueChange,
    onchange,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  function handleChange(event: Event & { currentTarget: EventTarget & HTMLSelectElement }) {
    onValueChange?.(event.currentTarget.value as T | '');
    onchange?.(event);
  }
</script>

<select
  bind:this={ref}
  bind:value
  {required}
  aria-label={label}
  class={cx('ldt-select', boxed && 'ldt-select--boxed', className)}
  {...rest}
  onchange={handleChange}
>
  {#if placeholder}<option value="" disabled={required} hidden={required}>{placeholder}</option
    >{/if}
  {#each options as option (option.value)}<option value={option.value} disabled={option.disabled}
      >{option.label}</option
    >{/each}
</select>
