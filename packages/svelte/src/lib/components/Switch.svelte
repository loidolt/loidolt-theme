<script lang="ts">
  import { onMount } from 'svelte';
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLButtonAttributes {
    checked?: boolean;
    disabled?: boolean;
    /** Set to submit the state with a form; renders a hidden checkbox alongside the switch. */
    name?: string;
    /** Submitted value when checked. */
    value?: string;
    onCheckedChange?: (checked: boolean) => void;
    class?: string;
    children?: Snippet;
    ref?: HTMLButtonElement | null;
  }

  let {
    checked = $bindable(false),
    disabled = false,
    name,
    form,
    value = 'on',
    onCheckedChange,
    onclick,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let input = $state<HTMLInputElement | null>(null);
  const initialChecked = checked;

  onMount(() => {
    const owner = input?.form;
    if (!owner) return;
    const reset = () => {
      checked = initialChecked;
      onCheckedChange?.(checked);
    };
    owner.addEventListener('reset', reset);
    return () => owner.removeEventListener('reset', reset);
  });

  function handleClick(event: MouseEvent & { currentTarget: EventTarget & HTMLButtonElement }) {
    if (disabled) return;
    checked = !checked;
    onCheckedChange?.(checked);
    onclick?.(event);
  }
</script>

<button
  bind:this={ref}
  type="button"
  role="switch"
  aria-checked={checked}
  {disabled}
  {form}
  class={cx('ldt-switch', className)}
  {...rest}
  onclick={handleClick}
>
  <span class="ldt-switch__track" aria-hidden="true"><span class="ldt-switch__thumb"></span></span>
  {#if children}<span>{@render children()}</span>{/if}
</button>
{#if name}<input
    bind:this={input}
    type="checkbox"
    class="ldt-sr-only"
    tabindex="-1"
    aria-hidden="true"
    {name}
    {form}
    {value}
    {checked}
    {disabled}
  />{/if}
