<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface CommonProps {
    title?: string;
    description?: string;
    header?: Snippet;
    children: Snippet;
    footer?: Snippet;
    headingLevel?: HeadingLevel;
    class?: string;
    ref?: HTMLElement | null;
  }

  // Discriminated on `href`, like Button: with it the whole card is an anchor and accepts
  // anchor attributes; without it the root stays a plain container element.
  type Props = CommonProps &
    (
      | (Omit<HTMLAnchorAttributes, 'class'> & {
          /** Renders the card as one block-level link. */
          href: string;
          as?: never;
        })
      | (Omit<HTMLAttributes<HTMLElement>, 'class'> & {
          href?: never;
          /** Root element. `div` by default — use `article` only for self-contained content. */
          as?: 'div' | 'article' | 'section' | 'li';
        })
    );

  let {
    title,
    description,
    header,
    children,
    footer,
    as = 'div',
    href,
    headingLevel = 3,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const element = $derived(href ? 'a' : as);
  const classes = $derived(cx('ldt-card', href && 'ldt-card--link', className));
</script>

<svelte:element this={element} bind:this={ref} class={classes} {href} {...rest}>
  {#if header || title || description}<header class="ldt-card__header">
      {#if header}{@render header()}{:else}{#if title}<svelte:element
            this={`h${headingLevel}`}
            class="ldt-card__title">{title}</svelte:element
          >{/if}{#if description}<p class="ldt-card__description">{description}</p>{/if}{/if}
    </header>{/if}
  <div class="ldt-card__content">{@render children()}</div>
  {#if footer}<footer class="ldt-card__footer">{@render footer()}</footer>{/if}
</svelte:element>
