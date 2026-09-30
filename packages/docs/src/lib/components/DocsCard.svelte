<script lang="ts">
  import type { Snippet } from 'svelte';
  import { Card, cx } from '@loidolt/theme-svelte';
  import type { HeadingLevel } from '@loidolt/theme-svelte';

  interface Props {
    title: string;
    href: string;
    description?: string;
    /** A short label above the title, e.g. a category. */
    eyebrow?: string;
    /** Opens in a new tab, and says so to assistive tech. */
    external?: boolean;
    externalLabel?: string;
    headingLevel?: HeadingLevel;
    /** Anything else inside the card, below the description. */
    children?: Snippet;
    class?: string;
  }

  let {
    title,
    href,
    description,
    eyebrow,
    external = false,
    externalLabel = '(opens in a new tab)',
    headingLevel = 3,
    children,
    class: className,
  }: Props = $props();
</script>

<!-- The whole card is the link, so the target is the card, not a line of text inside it. -->
<Card
  {href}
  {headingLevel}
  class={cx('ldt-docs-card', className)}
  target={external ? '_blank' : undefined}
  rel={external ? 'noopener' : undefined}
>
  {#snippet header()}
    {#if eyebrow}<p class="ldt-docs-card__eyebrow">{eyebrow}</p>{/if}
    <svelte:element this={`h${headingLevel}`} class="ldt-card__title"
      >{title}{#if external}<span class="ldt-sr-only"> {externalLabel}</span>{/if}</svelte:element
    >
    {#if description}<p class="ldt-card__description">{description}</p>{/if}
  {/snippet}
  {@render children?.()}
</Card>
