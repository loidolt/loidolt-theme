<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    title: string;
    /** What to do about it. An empty state without a next step is just a blank screen. */
    description?: string;
    /** Leading visual, sized by the consumer. */
    icon?: Snippet;
    /** Buttons or links offering the next step. */
    actions?: Snippet;
    headingLevel?: HeadingLevel;
    class?: string;
    children?: Snippet;
    ref?: HTMLDivElement | null;
  }

  let {
    title,
    description,
    icon,
    actions,
    headingLevel = 3,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div bind:this={ref} class={cx('ldt-empty-state', className)} {...rest}>
  {#if icon}<div class="ldt-empty-state__icon" aria-hidden="true">{@render icon()}</div>{/if}
  <svelte:element this={`h${headingLevel}`} class="ldt-empty-state__title">{title}</svelte:element>
  {#if description}<p class="ldt-empty-state__description">{description}</p>{/if}
  {#if children}{@render children()}{/if}
  {#if actions}<div class="ldt-empty-state__actions">{@render actions()}</div>{/if}
</div>
