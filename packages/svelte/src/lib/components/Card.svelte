<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    title?: string;
    description?: string;
    header?: Snippet;
    children: Snippet;
    footer?: Snippet;
    /** Root element. `div` by default — use `article` only for self-contained content. */
    as?: 'div' | 'article' | 'section' | 'li';
    headingLevel?: HeadingLevel;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    title,
    description,
    header,
    children,
    footer,
    as = 'div',
    headingLevel = 3,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<svelte:element this={as} bind:this={ref} class={cx('ldt-card', className)} {...rest}>
  {#if header || title || description}<header class="ldt-card__header">
      {#if header}{@render header()}{:else}{#if title}<svelte:element
            this={`h${headingLevel}`}
            class="ldt-card__title">{title}</svelte:element
          >{/if}{#if description}<p class="ldt-card__description">{description}</p>{/if}{/if}
    </header>{/if}
  <div class="ldt-card__content">{@render children()}</div>
  {#if footer}<footer class="ldt-card__footer">{@render footer()}</footer>{/if}
</svelte:element>
