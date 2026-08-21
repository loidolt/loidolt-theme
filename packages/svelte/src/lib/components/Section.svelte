<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    title?: string;
    eyebrow?: string;
    actions?: Snippet;
    headingLevel?: HeadingLevel;
    class?: string;
    children: Snippet;
    ref?: HTMLElement | null;
  }

  let {
    title,
    eyebrow,
    actions,
    headingLevel = 2,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<section bind:this={ref} class={cx('ldt-section', className)} {...rest}>
  {#if title || eyebrow || actions}<header class="ldt-section__heading">
      <div>
        {#if eyebrow}<p class="ldt-eyebrow">{eyebrow}</p>{/if}{#if title}<svelte:element
            this={`h${headingLevel}`}
            class="ldt-section__title">{title}</svelte:element
          >{/if}
      </div>
      {#if actions}<div class="ldt-cluster">{@render actions()}</div>{/if}
    </header>{/if}{@render children()}
</section>
