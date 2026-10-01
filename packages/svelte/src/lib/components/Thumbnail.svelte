<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { aspectRatio } from '@loidolt/theme-tokens';
  import type { AspectRatioName } from '../media-utils.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    src?: string;
    /** Required whenever `src` is set — decorative images should say so with `alt=""`. */
    alt?: string;
    /** Candidate sources for responsive images, with `sizes`. */
    srcset?: string;
    sizes?: string;
    /** A named frame (`photo`, `video`, `square`…), a CSS aspect-ratio value, or a number. */
    ratio?: AspectRatioName | string | number;
    fit?: 'contain' | 'cover';
    /** `sunken` recesses into the page; `paper` stays white in every theme for artwork. */
    surface?: 'sunken' | 'paper';
    /** `lazy` (the default) waits until the image nears the viewport. */
    loading?: 'lazy' | 'eager';
    /** Shown if the image fails to load. Defaults to an empty frame. */
    fallback?: Snippet;
    /** Content over the image — a badge, a duration, a selection mark. */
    overlay?: Snippet;
    /** Alternative to `src` — inline SVG, canvas, anything that fills the frame. */
    children?: Snippet;
    onload?: (event: Event) => void;
    onerror?: (event: Event) => void;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    src,
    alt = '',
    srcset,
    sizes,
    ratio = '4/3',
    fit = 'contain',
    surface = 'sunken',
    loading = 'lazy',
    fallback,
    overlay,
    children,
    onload,
    onerror,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const frame = $derived(
    typeof ratio === 'string' && ratio in aspectRatio
      ? aspectRatio[ratio as AspectRatioName]
      : ratio
  );

  // Resets to `loading` whenever `src` changes; the image's own events move it on.
  let status = $derived.by<'loading' | 'loaded' | 'error'>(() => {
    void src;
    return 'loading';
  });
</script>

<figure
  bind:this={ref}
  class={cx(
    'ldt-thumbnail',
    surface === 'paper' && 'ldt-thumbnail--paper',
    fit === 'cover' && 'ldt-thumbnail--cover',
    className
  )}
  style={`--ldt-thumbnail-ratio: ${frame};`}
  data-status={src && !children ? status : undefined}
  {...rest}
>
  {#if children}{@render children()}{:else if src && status === 'error'}{#if fallback}{@render fallback()}{:else}<span
        class="ldt-sr-only">{alt}</span
      >{/if}{:else if src}<img
      class="ldt-thumbnail__image"
      {src}
      {alt}
      {srcset}
      {sizes}
      {loading}
      decoding="async"
      onload={(event) => {
        status = 'loaded';
        onload?.(event);
      }}
      onerror={(event) => {
        status = 'error';
        onerror?.(event);
      }}
    />{/if}{#if overlay}<div class="ldt-thumbnail__overlay">{@render overlay()}</div>{/if}
</figure>
