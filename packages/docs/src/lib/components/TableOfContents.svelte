<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '@loidolt/theme-svelte';
  import type { TocItem } from '../core/types.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** The headings to list — `toc` from `renderMarkdown`. */
    items: TocItem[];
    /** Names the list; shown above it. */
    title?: string;
    /** Where the headings are. Scroll tracking only looks inside it. Defaults to the document. */
    container?: HTMLElement | null;
    /** The heading being read. Bindable; follows scrolling. */
    activeId?: string | null;
    /**
     * Space at the top of the viewport that hides content, e.g. a sticky header, in pixels. A
     * heading counts as current once it clears it.
     */
    offset?: number;
    /** A link was followed — `TocPanel` closes its drawer on this. */
    onNavigate?: (item: TocItem) => void;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    items,
    title = 'On this page',
    container = null,
    activeId = $bindable(null),
    offset = 72,
    onNavigate,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const id = $props.id();
  const shallowest = $derived(Math.min(...items.map((item) => item.depth)));

  // Scroll-spy: a heading is current while it sits in a band near the top of the viewport; between
  // headings — deep in a long section — the last one stays current.
  $effect(() => {
    const scope: Document | HTMLElement = container ?? document;
    const targets = items
      .map((item) => scope.querySelector<HTMLElement>(`#${CSS.escape(item.id)}`))
      .filter((element): element is HTMLElement => element !== null);
    if (!targets.length || typeof IntersectionObserver === 'undefined') return;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity -- observer bookkeeping, never rendered
    const inBand = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) inBand.add(entry.target.id);
          else inBand.delete(entry.target.id);
        }
        const first = targets.find((target) => inBand.has(target.id));
        if (first) activeId = first.id;
      },
      { rootMargin: `-${offset}px 0px -60% 0px` }
    );
    for (const target of targets) observer.observe(target);
    return () => observer.disconnect();
  });
</script>

<nav bind:this={ref} class={cx('ldt-toc', className)} aria-labelledby={`${id}-title`} {...rest}>
  <p class="ldt-toc__title" id={`${id}-title`}>{title}</p>
  <ol class="ldt-toc__list">
    {#each items as item (item.id)}
      <li class="ldt-toc__item" style:--ldt-toc-level={item.depth - shallowest}>
        <a
          class="ldt-toc__link"
          href={`#${item.id}`}
          aria-current={activeId === item.id ? 'location' : undefined}
          onclick={() => {
            activeId = item.id;
            onNavigate?.(item);
          }}>{item.text}</a
        >
      </li>
    {/each}
  </ol>
</nav>
