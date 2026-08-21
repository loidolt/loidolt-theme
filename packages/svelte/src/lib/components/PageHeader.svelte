<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    eyebrow?: string;
    title: string;
    description?: string;
    actions?: Snippet;
    headingLevel?: HeadingLevel;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    eyebrow,
    title,
    description,
    actions,
    headingLevel = 1,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<header bind:this={ref} class={cx('ldt-page-header', className)} {...rest}>
  <div>
    {#if eyebrow}<p class="ldt-eyebrow">{eyebrow}</p>{/if}
    <svelte:element this={`h${headingLevel}`} class="ldt-page-header__title">{title}</svelte:element
    >
    {#if description}<p class="ldt-page-header__description">{description}</p>{/if}
  </div>
  {#if actions}<div class="ldt-cluster">{@render actions()}</div>{/if}
</header>
