<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    side?: 'left' | 'right';
    /**
     * Accessible name. Only needed to tell several complementary regions apart — leave unset
     * for a single sidebar, since "Sidebar" only repeats the role.
     */
    label?: string;
    class?: string;
    children: Snippet;
    ref?: HTMLElement | null;
  }

  let {
    side = 'left',
    label,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<aside
  bind:this={ref}
  class={cx('ldt-sidebar ldt-scrollbar', side === 'right' && 'ldt-sidebar--right', className)}
  aria-label={label}
  {...rest}
>
  {@render children()}
</aside>
