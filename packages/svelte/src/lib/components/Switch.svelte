<script lang="ts">
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
    value = 'on',
    onCheckedChange,
    onclick,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

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
  class={cx('ldt-switch', className)}
  {...rest}
  onclick={handleClick}
>
  <span class="ldt-switch__track" aria-hidden="true"><span class="ldt-switch__thumb"></span></span>
  {#if children}<span>{@render children()}</span>{/if}
</button>
{#if name}<input
    type="checkbox"
    class="ldt-sr-only"
    tabindex="-1"
    aria-hidden="true"
    {name}
    {value}
    {checked}
    {disabled}
  />{/if}
