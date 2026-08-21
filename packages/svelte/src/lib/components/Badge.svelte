<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { BadgeSize, BadgeVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    class?: string;
    children: Snippet;
    ref?: HTMLSpanElement | null;
  }

  let {
    variant = 'default',
    size = 'inline',
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<span
  bind:this={ref}
  class={cx(
    'ldt-badge',
    variant !== 'default' && `ldt-badge--${variant}`,
    size !== 'inline' && `ldt-badge--${size}`,
    className
  )}
  {...rest}>{@render children()}</span
>
