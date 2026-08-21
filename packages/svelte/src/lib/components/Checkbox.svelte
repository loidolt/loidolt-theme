<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLInputAttributes, 'type' | 'checked'> {
    checked?: boolean;
    indeterminate?: boolean;
    disabled?: boolean;
    /**
     * Visible text when there are no `children`. One of `children`, `label` or an
     * `aria-labelledby` in the rest props is required, or the control is unnamed.
     */
    label?: string;
    onCheckedChange?: (checked: boolean) => void;
    /** `class` lands on the wrapping `<label>`; use `inputClass` to reach the input. */
    class?: string;
    inputClass?: string;
    children?: Snippet;
    ref?: HTMLInputElement | null;
  }

  let {
    checked = $bindable(false),
    indeterminate = $bindable(false),
    disabled = false,
    label,
    onCheckedChange,
    onchange,
    class: className,
    inputClass,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  function handleChange(event: Event & { currentTarget: EventTarget & HTMLInputElement }): void {
    onCheckedChange?.(event.currentTarget.checked);
    onchange?.(event);
  }
</script>

<label class={cx('ldt-choice', className)}
  ><input
    bind:this={ref}
    type="checkbox"
    class={inputClass}
    bind:checked
    bind:indeterminate
    {disabled}
    {...rest}
    onchange={handleChange}
  />{#if children}{@render children()}{:else if label}{label}{/if}</label
>
