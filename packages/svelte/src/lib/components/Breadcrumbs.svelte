<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Crumb } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Ordered trail, root first. The last entry is the current page and is never a link. */
    items: Crumb[];
    /** Accessible name of the landmark. Several trails on one page need distinct names. */
    label?: string;
    /**
     * Separator drawn between crumbs. Decorative — it lives in a `::before` on the list item, so
     * it is never read out or copied with the text.
     */
    separator?: string;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    items,
    label = 'Breadcrumb',
    separator = '/',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<nav
  bind:this={ref}
  class={cx('ldt-breadcrumbs', className)}
  aria-label={label}
  style={`--ldt-breadcrumb-separator: ${JSON.stringify(separator)}`}
  {...rest}
>
  <ol class="ldt-breadcrumbs__list">
    {#each items as item, index (item.label)}
      {@const current = index === items.length - 1}
      <li class="ldt-breadcrumbs__item">
        {#if item.href && !current}
          <a class="ldt-breadcrumbs__link" href={item.href}>{item.label}</a>
        {:else}
          <!-- The current page is not a link, and says so. Marking it up as one that goes
               nowhere is the most common breadcrumb defect. -->
          <span class="ldt-breadcrumbs__current" aria-current={current ? 'page' : undefined}
            >{item.label}</span
          >
        {/if}
      </li>
    {/each}
  </ol>
</nav>
