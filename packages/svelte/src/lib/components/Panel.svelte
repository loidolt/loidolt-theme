<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    title?: string;
    header?: Snippet;
    children: Snippet;
    footer?: Snippet;
    headingLevel?: HeadingLevel;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    title,
    header,
    children,
    footer,
    headingLevel = 2,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<section bind:this={ref} class={cx('ldt-panel', className)} {...rest}>
  {#if header || title}<header class="ldt-panel__header">
      {#if header}{@render header()}{:else}<svelte:element
          this={`h${headingLevel}`}
          class="ldt-panel__title">{title}</svelte:element
        >{/if}
    </header>{/if}
  <div class="ldt-panel__content">{@render children()}</div>
  {#if footer}<footer class="ldt-panel__footer">{@render footer()}</footer>{/if}
</section>
