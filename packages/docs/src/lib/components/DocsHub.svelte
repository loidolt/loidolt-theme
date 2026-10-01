<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '@loidolt/theme-svelte';
  import type { HeadingLevel } from '@loidolt/theme-svelte';
  import type { DocsSection } from '../core/types.js';
  import DocsCard from './DocsCard.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** Groups of pages, each with a heading and a grid of cards. */
    sections: DocsSection[];
    /** Level of the section headings; the cards take the next one. */
    headingLevel?: HeadingLevel;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    sections,
    headingLevel = 2,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const cardLevel = $derived(Math.min(headingLevel + 1, 6) as HeadingLevel);
</script>

<div bind:this={ref} class={cx('ldt-docs-hub', className)} {...rest}>
  {#each sections as section (section.title)}
    <section class="ldt-docs-hub__section">
      <svelte:element this={`h${headingLevel}`} class="ldt-docs-hub__title"
        >{section.title}</svelte:element
      >
      {#if section.description}<p class="ldt-docs-hub__description">{section.description}</p>{/if}
      <ul class="ldt-docs-hub__grid">
        {#each section.items as item (item.href)}
          <li>
            <DocsCard
              title={item.title}
              href={item.href}
              description={item.description}
              eyebrow={item.eyebrow}
              external={item.external}
              headingLevel={cardLevel}
            />
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
