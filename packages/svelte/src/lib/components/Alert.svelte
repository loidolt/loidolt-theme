<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { HeadingLevel, StatusVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    variant?: StatusVariant;
    title: string;
    /** Heading element used for the title, so the alert fits the page outline. */
    headingLevel?: HeadingLevel;
    class?: string;
    children?: Snippet;
    ref?: HTMLDivElement | null;
  }

  let {
    variant = 'info',
    title,
    headingLevel = 3,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<div
  bind:this={ref}
  class={cx('ldt-alert', `ldt-alert--${variant}`, className)}
  role={variant === 'error' ? 'alert' : 'status'}
  {...rest}
>
  <svelte:element this={`h${headingLevel}`} class="ldt-alert__title">{title}</svelte:element>
  {#if children}<div class="ldt-alert__description">{@render children()}</div>{/if}
</div>
