<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLButtonAttributes } from 'svelte/elements';
  import type { ActionVariant, ControlSize } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLButtonAttributes {
    /** Accessible name for the icon-only control. Required — there is no visible text. */
    label: string;
    variant?: ActionVariant;
    size?: ControlSize;
    disabled?: boolean;
    class?: string;
    children: Snippet;
    ref?: HTMLButtonElement | null;
  }

  let {
    label,
    variant = 'ghost',
    size = 'md',
    disabled = false,
    type = 'button',
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<button
  bind:this={ref}
  {type}
  {disabled}
  class={cx(
    'ldt-button ldt-icon-button',
    variant !== 'default' && `ldt-button--${variant}`,
    size !== 'md' && `ldt-button--${size}`,
    className
  )}
  aria-label={label}
  {...rest}>{@render children()}</button
>
