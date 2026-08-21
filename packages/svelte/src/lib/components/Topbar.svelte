<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    brand: Snippet;
    navigation?: Snippet;
    actions?: Snippet;
    /** Accessible name of the `<nav>`, so several navs stay distinguishable. */
    navLabel?: string;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    brand,
    navigation,
    actions,
    navLabel = 'Primary',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<header bind:this={ref} class={cx('ldt-topbar', className)} {...rest}>
  <div>{@render brand()}</div>
  {#if navigation}<nav class="ldt-topbar__nav" aria-label={navLabel}>
      {@render navigation()}
    </nav>{/if}{#if actions}<div class="ldt-topbar__actions">{@render actions()}</div>{/if}
</header>
