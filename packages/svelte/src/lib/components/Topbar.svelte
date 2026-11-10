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
    /**
     * Lets the bar drag its window in a desktop app: sets `data-tauri-drag-region`, which Tauri
     * reads, on the bar and its regions. Buttons, links and fields inside stay clickable. A plain
     * attribute everywhere else, so it is harmless in a browser.
     */
    dragRegion?: boolean;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    brand,
    navigation,
    actions,
    navLabel = 'Primary',
    dragRegion = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  /*
   * `deep` makes a press anywhere in the subtree drag the window, except on an interactive
   * element (a button, link, field, or anything focusable) — Tauri skips those itself. Releases
   * of Tauri 2 that predate `deep` only drag on a press that lands on the element carrying the
   * attribute, so it goes on the bar's own regions too, which cover most of its empty space.
   */
  const drag = $derived(dragRegion ? 'deep' : undefined);
</script>

<header bind:this={ref} class={cx('ldt-topbar', className)} data-tauri-drag-region={drag} {...rest}>
  <div data-tauri-drag-region={drag}>{@render brand()}</div>
  {#if navigation}<nav class="ldt-topbar__nav" aria-label={navLabel} data-tauri-drag-region={drag}>
      {@render navigation()}
    </nav>{/if}{#if actions}<div class="ldt-topbar__actions" data-tauri-drag-region={drag}>
      {@render actions()}
    </div>{/if}
</header>
