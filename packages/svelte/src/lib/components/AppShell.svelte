<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Complete banner/header content, such as `Topbar`; rendered without another landmark wrapper. */
    header?: Snippet;
    children: Snippet;
    /** Render the content row without a second `main` landmark inside an embedded preview. */
    embedded?: boolean;
    footer?: Snippet;
    /**
     * Bottom navigation, such as `TabBar`, rendered last and pinned to the bottom of the screen
     * while the page scrolls. It takes the bottom safe-area inset in place of the rows above.
     */
    tabBar?: Snippet;
    /** `id` of the content row (`<main>` unless embedded), for skip links or demo targeting. */
    mainId?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    header,
    children,
    embedded = false,
    footer,
    tabBar,
    mainId = 'main',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div bind:this={ref} class={cx('ldt-app-shell', className)} {...rest}>
  {#if header}{@render header()}{/if}
  {#if embedded}
    <div id={mainId} class="ldt-app-shell__main">{@render children()}</div>
  {:else}
    <main id={mainId}>{@render children()}</main>
  {/if}
  {#if footer}<footer>{@render footer()}</footer>{/if}
  {#if tabBar}{@render tabBar()}{/if}
</div>
