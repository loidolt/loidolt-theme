<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    number?: number;
    /** `dot` sits in lists; `pin` is the teardrop that points at a spot on a canvas. */
    shape?: 'dot' | 'pin';
    active?: boolean;
    /** Accessible name, e.g. "Comment 3". Omit when adjacent text already names it. */
    label?: string;
    class?: string;
    ref?: HTMLSpanElement | null;
  }

  let {
    number,
    shape = 'dot',
    active = false,
    label,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<span
  bind:this={ref}
  class={cx(
    'ldt-marker',
    shape === 'pin' && 'ldt-marker--pin',
    active && 'ldt-marker--active',
    className
  )}
  {...rest}
  >{#if number !== undefined}{number}{/if}{#if label}<span class="ldt-sr-only">{label}</span
    >{/if}</span
>
