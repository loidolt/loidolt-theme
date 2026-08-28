<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    src?: string;
    /** Required whenever `src` is set — decorative images should say so with `alt=""`. */
    alt?: string;
    /** CSS aspect-ratio value: `'4/3'`, `'1/1'`, or a number. */
    ratio?: string | number;
    fit?: 'contain' | 'cover';
    /** `sunken` recesses into the page; `paper` stays white in every theme for artwork. */
    surface?: 'sunken' | 'paper';
    /** Alternative to `src` — inline SVG, canvas, anything that fills the frame. */
    children?: Snippet;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    src,
    alt = '',
    ratio = '4/3',
    fit = 'contain',
    surface = 'sunken',
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<figure
  bind:this={ref}
  class={cx(
    'ldt-thumbnail',
    surface === 'paper' && 'ldt-thumbnail--paper',
    fit === 'cover' && 'ldt-thumbnail--cover',
    className
  )}
  style={`--ldt-thumbnail-ratio: ${ratio};`}
  {...rest}
>
  {#if children}{@render children()}{:else if src}<img
      class="ldt-thumbnail__image"
      {src}
      {alt}
      loading="lazy"
    />{/if}
</figure>
