<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { resolveAspectRatio, type AspectRatioName } from '../media-utils.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** A named frame (`video`, `photo`, `square`, `portrait`, `wide`), a number, or `'4 / 3'`. */
    ratio?: AspectRatioName | number | string;
    children?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    ratio = 'video',
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<!-- Native `aspect-ratio`: the box keeps its shape before anything inside it has loaded. -->
<div
  bind:this={ref}
  class={cx('ldt-aspect-ratio', className)}
  style:--ldt-aspect-ratio={resolveAspectRatio(ratio)}
  {...rest}
>
  {#if children}{@render children()}{/if}
</div>
