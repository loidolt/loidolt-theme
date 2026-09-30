<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    /**
     * The shape standing in for content. `block` (the default) is sized by `width` and `height`;
     * the others take the metrics of what they replace — a line of body text, a heading, an
     * avatar, a button, a card.
     */
    variant?: 'block' | 'text' | 'title' | 'avatar' | 'button' | 'card';
    /** For `text`: how many lines. The last one is shorter, as a paragraph's usually is. */
    lines?: number;
    /** Number is treated as pixels; strings pass through as CSS. */
    width?: string | number;
    height?: string | number;
    class?: string;
    ref?: HTMLSpanElement | null;
  }

  let {
    variant = 'block',
    lines = 1,
    width,
    height,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const size = (value: string | number | undefined) =>
    typeof value === 'number' ? `${value}px` : value;
</script>

{#if variant === 'text' && lines > 1}
  <span
    bind:this={ref}
    class={cx('ldt-skeleton-lines', className)}
    style:width={size(width)}
    aria-hidden="true"
    {...rest}
  >
    {#each { length: lines }, index (index)}<span
        class="ldt-skeleton ldt-skeleton--text"
        style:width={index === lines - 1 ? '60%' : undefined}
      ></span>{/each}
  </span>
{:else}
  <span
    bind:this={ref}
    class={cx('ldt-skeleton', variant !== 'block' && `ldt-skeleton--${variant}`, className)}
    style:width={size(width)}
    style:height={size(height)}
    aria-hidden="true"
    {...rest}
  ></span>
{/if}
