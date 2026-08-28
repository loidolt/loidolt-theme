<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import type { ControlSize } from '../types.js';
  import { cx } from '../utils.js';

  interface SegmentedNavItem {
    label: string;
    href: string;
    /** Marks the current page (`aria-current="page"`), which is also the pressed style. */
    current?: boolean;
    /** Small trailing annotation, e.g. "latest". */
    hint?: string;
  }

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    items: SegmentedNavItem[];
    /** Accessible name of the navigation region. */
    label?: string;
    size?: ControlSize;
    class?: string;
    itemClass?: string;
    ref?: HTMLElement | null;
  }

  let {
    items,
    label = 'Sections',
    size = 'md',
    class: className,
    itemClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!-- ToggleGroup's shape for navigation: options are real links, so open-in-new-tab and the
     rotor both work — an anchor inside a radiogroup would surrender that. -->
<nav
  bind:this={ref}
  class={cx('ldt-segmented-nav', size !== 'md' && `ldt-toggle-group--${size}`, className)}
  aria-label={label}
  {...rest}
>
  {#each items as item, index (index)}
    <a
      class={cx('ldt-toggle-group__item', itemClass)}
      href={item.href}
      aria-current={item.current ? 'page' : undefined}
    >
      {item.label}{#if item.hint}<span class="ldt-segmented-nav__hint">{item.hint}</span>{/if}
    </a>
  {/each}
</nav>
