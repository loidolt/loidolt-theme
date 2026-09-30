<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import MediaStage from '../internal/media/MediaStage.svelte';
  import { createMediaQuery } from '../media.svelte.js';
  import {
    mediaKey,
    mediaLabel,
    mediaThumbnail,
    resolveAspectRatio,
    type AspectRatioName,
    type MediaItem,
  } from '../media-utils.js';
  import { cx } from '../utils.js';
  import Filmstrip from './Filmstrip.svelte';
  import Thumbnail from './Thumbnail.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLElement>, 'children'> {
    items: MediaItem[];
    /** Accessible name of the carousel. */
    label: string;
    /** The slide showing, 0-based. */
    index?: number;
    loop?: boolean;
    ratio?: AspectRatioName | number | string;
    showThumbnails?: boolean;
    showCaption?: boolean;
    /**
     * Advance on a timer. It pauses while the pointer or focus is inside, offers a visible
     * pause button (WCAG 2.2.2), and starts paused for people who prefer reduced motion.
     */
    autoplay?: boolean;
    /** Milliseconds per slide when autoplaying. */
    interval?: number;
    previousLabel?: string;
    nextLabel?: string;
    pauseLabel?: string;
    playLabel?: string;
    thumbnailsLabel?: string;
    slideLabel?: (position: number, count: number) => string;
    onIndexChange?: (index: number) => void;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    items,
    label,
    index = $bindable(0),
    loop = true,
    ratio = 'video',
    showThumbnails = false,
    showCaption = true,
    autoplay = false,
    interval = 5000,
    previousLabel = 'Previous slide',
    nextLabel = 'Next slide',
    pauseLabel = 'Pause slideshow',
    playLabel = 'Start slideshow',
    thumbnailsLabel = 'Slides',
    slideLabel = (position, count) => `${position} of ${count}`,
    onIndexChange,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const reducedMotion = createMediaQuery('(prefers-reduced-motion: reduce)');
  const count = $derived(items.length);
  const ids = $derived(items.map((item, position) => mediaKey(item, position)));
  const canPrevious = $derived(loop ? count > 1 : index > 0);
  const canNext = $derived(loop ? count > 1 : index < count - 1);

  // `rotating` is the user's choice; `held` covers hover and focus, which pause without changing it.
  let rotating = $derived(autoplay && !reducedMotion.matches);
  let hovered = $state(false);
  let focused = $state(false);
  const running = $derived(rotating && !hovered && !focused && count > 1);

  function go(next: number) {
    if (count === 0) return;
    const target = loop ? (next + count) % count : Math.min(Math.max(0, next), count - 1);
    if (target === index) return;
    index = target;
    onIndexChange?.(target);
  }

  $effect(() => {
    if (!running) return;
    const timer = setInterval(() => go(index + 1), interval);
    return () => clearInterval(timer);
  });
</script>

<section
  bind:this={ref}
  class={cx('ldt-media-carousel', className)}
  aria-roledescription="carousel"
  aria-label={label}
  onpointerenter={() => (hovered = true)}
  onpointerleave={() => (hovered = false)}
  onfocusin={() => (focused = true)}
  onfocusout={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) focused = false;
  }}
  {...rest}
>
  <div class="ldt-media-carousel__controls">
    {#if autoplay}<button
        type="button"
        class="ldt-media-carousel__control"
        aria-label={rotating ? pauseLabel : playLabel}
        onclick={() => (rotating = !rotating)}
        ><svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" focusable="false"
          >{#if rotating}<path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />{:else}<path
              d="M4 2.5v11l9-5.5z"
              fill="currentColor"
            />{/if}</svg
        ></button
      >{/if}
    <button
      type="button"
      class="ldt-media-carousel__control"
      aria-label={previousLabel}
      disabled={!canPrevious}
      onclick={() => go(index - 1)}
      ><span class="ldt-media-carousel__chevron" aria-hidden="true"></span></button
    >
    <button
      type="button"
      class="ldt-media-carousel__control ldt-media-carousel__control--next"
      aria-label={nextLabel}
      disabled={!canNext}
      onclick={() => go(index + 1)}
      ><span class="ldt-media-carousel__chevron" aria-hidden="true"></span></button
    >
  </div>
  <!--
    Polite while the user drives it; silent while it rotates on its own, so a screen reader is
    not interrupted every few seconds.
  -->
  <div
    class="ldt-media-carousel__viewport"
    style:--ldt-aspect-ratio={resolveAspectRatio(ratio)}
    aria-live={running ? 'off' : 'polite'}
  >
    {#each items as item, position (ids[position])}
      <div
        class="ldt-media-carousel__slide"
        role="group"
        aria-roledescription="slide"
        aria-label={`${slideLabel(position + 1, count)}: ${mediaLabel(item, position)}`}
        hidden={position !== index}
      >
        {#if position === index}<MediaStage {item} fit="cover" />{/if}
        {#if showCaption && item.caption}<p class="ldt-media-carousel__caption">
            {item.caption}
          </p>{/if}
      </div>
    {/each}
  </div>
  {#if showThumbnails && count > 1}
    <Filmstrip
      orientation="horizontal"
      label={thumbnailsLabel}
      items={ids.map((id) => ({ id }))}
      selectedId={ids[index]}
      onSelect={(id) => go(ids.indexOf(id))}
    >
      {#snippet item(entry)}
        {@const position = ids.indexOf(entry.id)}
        <Thumbnail src={mediaThumbnail(items[position])} alt="" ratio="square" fit="cover" /><span
          class="ldt-sr-only">{mediaLabel(items[position], position)}</span
        >
      {/snippet}
    </Filmstrip>
  {/if}
</section>
