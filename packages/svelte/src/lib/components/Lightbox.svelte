<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import MediaStage from '../internal/media/MediaStage.svelte';
  import { createMediaZoom } from '../media-zoom.svelte.js';
  import { mediaKey, mediaLabel, mediaThumbnail, type MediaItem } from '../media-utils.js';
  import type { TriggerChildProps } from '../types.js';
  import { cx } from '../utils.js';
  import Filmstrip from './Filmstrip.svelte';
  import LiveRegion from './LiveRegion.svelte';
  import Thumbnail from './Thumbnail.svelte';

  interface Props {
    items: MediaItem[];
    open?: boolean;
    /** The item showing, 0-based. */
    index?: number;
    /** Accessible name of the dialog. */
    title?: string;
    /** Wrap from the last item to the first. */
    loop?: boolean;
    showThumbnails?: boolean;
    showCaption?: boolean;
    showCounter?: boolean;
    /** Let images be zoomed and panned: pinch, Ctrl + wheel, double-click, or + and −. */
    zoomable?: boolean;
    /** Offer a download link for images that set `download`. */
    downloadable?: boolean;
    /** Opens the lightbox. Leave it out to drive `open` yourself, as `MediaGrid` does. */
    trigger?: Snippet;
    triggerChild?: Snippet<[TriggerChildProps]>;
    triggerClass?: string;
    closeLabel?: string;
    previousLabel?: string;
    nextLabel?: string;
    zoomInLabel?: string;
    zoomOutLabel?: string;
    downloadLabel?: string;
    thumbnailsLabel?: string;
    counterText?: (position: number, count: number) => string;
    onOpenChange?: (open: boolean) => void;
    onIndexChange?: (index: number) => void;
    /** Lands on the dialog content. */
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    items,
    open = $bindable(false),
    index = $bindable(0),
    title = 'Media viewer',
    loop = true,
    showThumbnails = false,
    showCaption = true,
    showCounter = true,
    zoomable = true,
    downloadable = false,
    trigger,
    triggerChild,
    triggerClass = 'ldt-button',
    closeLabel = 'Close viewer',
    previousLabel = 'Previous',
    nextLabel = 'Next',
    zoomInLabel = 'Zoom in',
    zoomOutLabel = 'Zoom out',
    downloadLabel = 'Download',
    thumbnailsLabel = 'All items',
    counterText = (position, count) => `${position} of ${count}`,
    onOpenChange,
    onIndexChange,
    class: className,
    ref = $bindable(null),
  }: Props = $props();

  const zoom = createMediaZoom();
  const count = $derived(items.length);
  const current = $derived(items[Math.min(Math.max(0, index), Math.max(0, count - 1))]);
  const ids = $derived(items.map((item, position) => mediaKey(item, position)));
  const canPrevious = $derived(loop ? count > 1 : index > 0);
  const canNext = $derived(loop ? count > 1 : index < count - 1);
  const isImage = $derived(current?.kind === 'image');

  function go(next: number) {
    if (count === 0) return;
    const target = loop ? (next + count) % count : Math.min(Math.max(0, next), count - 1);
    if (target === index) return;
    zoom.reset();
    index = target;
    onIndexChange?.(target);
  }

  function handleKeydown(event: KeyboardEvent) {
    // Keys aimed at a control inside the stage (a player's range, a select) stay with it.
    if ((event.target as HTMLElement).matches('input, select, textarea')) return;
    const handled = (() => {
      if (event.key === 'ArrowRight') go(index + 1);
      else if (event.key === 'ArrowLeft') go(index - 1);
      else if (event.key === 'Home') go(0);
      else if (event.key === 'End') go(count - 1);
      else if (zoomable && isImage && (event.key === '+' || event.key === '=')) zoom.zoomIn();
      else if (zoomable && isImage && event.key === '-') zoom.zoomOut();
      else if (zoomable && isImage && event.key === '0') zoom.reset();
      else return false;
      return true;
    })();
    if (handled) event.preventDefault();
  }

  // Swipe to navigate when the image is not zoomed (a zoomed image pans instead).
  let swipeStart: number | null = null;
  const onPointerDown = (event: PointerEvent) => {
    swipeStart = zoom.zoomed ? null : event.clientX;
  };
  const onPointerUp = (event: PointerEvent) => {
    if (swipeStart === null) return;
    const delta = event.clientX - swipeStart;
    swipeStart = null;
    if (Math.abs(delta) > 50) go(delta < 0 ? index + 1 : index - 1);
  };

  // Warm the neighbours, so moving on shows the next image at once.
  $effect(() => {
    if (!open || count < 2) return;
    for (const offset of [-1, 1]) {
      const neighbour = items[(index + offset + count) % count];
      if (neighbour?.kind === 'image') new Image().src = neighbour.src;
    }
  });

  function handleOpenChange(next: boolean) {
    if (!next) zoom.reset();
    onOpenChange?.(next);
  }
</script>

<DialogPrimitive.Root bind:open onOpenChange={handleOpenChange}>
  {#if triggerChild}<DialogPrimitive.Trigger
      >{#snippet child(childProps)}{@render triggerChild(
          childProps
        )}{/snippet}</DialogPrimitive.Trigger
    >{:else if trigger}<DialogPrimitive.Trigger class={triggerClass}
      >{@render trigger()}</DialogPrimitive.Trigger
    >{/if}
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay class="ldt-overlay ldt-lightbox__overlay" />
    <DialogPrimitive.Content
      bind:ref
      class={cx('ldt-lightbox', className)}
      onkeydown={handleKeydown}
    >
      <DialogPrimitive.Title class="ldt-sr-only">{title}</DialogPrimitive.Title>
      <div class="ldt-lightbox__bar">
        {#if showCounter && count}<span class="ldt-lightbox__counter" aria-hidden="true"
            >{counterText(index + 1, count)}</span
          >{/if}
        <div class="ldt-lightbox__tools">
          {#if zoomable && isImage}
            <button
              type="button"
              class="ldt-lightbox__control"
              aria-label={zoomOutLabel}
              disabled={zoom.scale <= 1}
              onclick={zoom.zoomOut}>−</button
            >
            <button
              type="button"
              class="ldt-lightbox__control"
              aria-label={zoomInLabel}
              onclick={zoom.zoomIn}>+</button
            >
          {/if}
          {#if downloadable && current?.kind === 'image' && current.download}<a
              class="ldt-lightbox__control ldt-lightbox__download"
              href={current.download}
              download>{downloadLabel}</a
            >{/if}
          <DialogPrimitive.Close class="ldt-lightbox__control" aria-label={closeLabel}
            >×</DialogPrimitive.Close
          >
        </div>
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="ldt-lightbox__stage"
        data-zoomed={zoom.zoomed ? '' : undefined}
        onpointerdown={onPointerDown}
        onpointerup={onPointerUp}
      >
        {#if current}
          {#key ids[index]}<MediaStage item={current} zoom={zoomable ? zoom : undefined} />{/key}
        {/if}
        {#if canPrevious}<button
            type="button"
            class="ldt-lightbox__control ldt-lightbox__nav ldt-lightbox__nav--previous"
            aria-label={previousLabel}
            onclick={() => go(index - 1)}
            ><span aria-hidden="true" class="ldt-lightbox__chevron"></span></button
          >{/if}
        {#if canNext}<button
            type="button"
            class="ldt-lightbox__control ldt-lightbox__nav ldt-lightbox__nav--next"
            aria-label={nextLabel}
            onclick={() => go(index + 1)}
            ><span aria-hidden="true" class="ldt-lightbox__chevron"></span></button
          >{/if}
      </div>
      {#if showCaption && current?.caption}<p class="ldt-lightbox__caption">
          {current.caption}
        </p>{/if}
      {#if showThumbnails && count > 1}
        <Filmstrip
          class="ldt-lightbox__strip"
          orientation="horizontal"
          label={thumbnailsLabel}
          items={ids.map((id) => ({ id }))}
          selectedId={ids[index]}
          onSelect={(id) => go(ids.indexOf(id))}
        >
          {#snippet item(entry)}
            {@const position = ids.indexOf(entry.id)}
            <Thumbnail
              src={mediaThumbnail(items[position])}
              alt=""
              ratio="square"
              fit="cover"
            /><span class="ldt-sr-only">{mediaLabel(items[position], position)}</span>
          {/snippet}
        </Filmstrip>
      {/if}
      <!-- The visible counter is hidden from assistive tech; this announces each move once. -->
      <LiveRegion
        message={count && current
          ? `${mediaLabel(current, index)}, ${counterText(index + 1, count)}`
          : ''}
      />
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
