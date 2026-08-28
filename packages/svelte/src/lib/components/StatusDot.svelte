<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { BadgeVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    /** Accessible name — color alone must never carry the state. */
    label: string;
    class?: string;
    ref?: HTMLSpanElement | null;
  }

  let {
    variant = 'default',
    label,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<span
  bind:this={ref}
  class={cx('ldt-status-dot', variant !== 'default' && `ldt-status-dot--${variant}`, className)}
  {...rest}><span class="ldt-sr-only">{label}</span></span
>
