<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { TabBarItem } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    /** Three to five top-level destinations; more than fit a thumb's reach belong in a Drawer. */
    items: TabBarItem[];
    /** Accessible name of the navigation region. */
    label?: string;
    class?: string;
    itemClass?: string;
    ref?: HTMLElement | null;
  }

  let {
    items,
    label = 'Primary',
    class: className,
    itemClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!--
  Bottom navigation for a phone: the same destinations as the topbar links, within reach of a
  thumb. Real links, so the router, open-in-new-tab and the screen-reader rotor all work, and
  `aria-current="page"` is both the semantic and the indicator. The icon is decorative — the label
  is always rendered, so the name never rests on a glyph. Nothing here generates an id, so the
  server and the first client frame cannot disagree.
-->
<nav bind:this={ref} class={cx('ldt-tab-bar', className)} aria-label={label} {...rest}>
  {#each items as item, index (index)}
    <a
      class={cx('ldt-tab-bar__item', itemClass)}
      href={item.href}
      aria-current={item.current ? 'page' : undefined}
    >
      {#if item.icon}<span class="ldt-tab-bar__icon" aria-hidden="true">{@render item.icon()}</span
        >{/if}<span class="ldt-tab-bar__label">{item.label}</span>
    </a>
  {/each}
</nav>
