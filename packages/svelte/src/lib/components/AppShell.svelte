<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Complete banner/header content, such as `Topbar`; rendered without another landmark wrapper. */
    header?: Snippet;
    children: Snippet;
    footer?: Snippet;
    /** `id` of the `<main>` element, for skip links. */
    mainId?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    header,
    children,
    footer,
    mainId = 'main',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div bind:this={ref} class={cx('ldt-app-shell', className)} {...rest}>
  {#if header}{@render header()}{/if}
  <main id={mainId}>{@render children()}</main>
  {#if footer}<footer>{@render footer()}</footer>{/if}
</div>
