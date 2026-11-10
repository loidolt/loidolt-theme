<script lang="ts">
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { rovingFocus } from '../attachments.js';
  import { createMediaZoom, type MediaZoomFit } from '../media-zoom.svelte.js';
  import type { ImageRegion } from '../types.js';
  import { cx } from '../utils.js';
  import LiveRegion from './LiveRegion.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    src: string;
    srcset?: string;
    alt: string;
    /**
     * The image's natural size in pixels. Read from the image once it loads when left out;
     * giving it lays the viewer out before then.
     */
    width?: number;
    height?: number;
    /** Rectangles drawn over the image, in its natural pixels. */
    regions?: ImageRegion[];
    /** The selected region. Setting it from outside brings that region into view. */
    selectedRegionId?: string | null;
    /** The region under the pointer — or one to highlight from outside, e.g. a hovered list row. */
    hoveredRegionId?: string | null;
    /** How the image is fitted at first, and again by 0. */
    fit?: MediaZoomFit;
    /** Lowest zoom, in screen pixels per image pixel. Never stops the whole image fitting. */
    minScale?: number;
    /** Highest zoom, in screen pixels per image pixel. */
    maxScale?: number;
    showControls?: boolean;
    /** Accessible name of the viewer. */
    label?: string;
    /** Accessible name of the region list. */
    regionsLabel?: string;
    controlsLabel?: string;
    zoomInLabel?: string;
    zoomOutLabel?: string;
    fitWidthLabel?: string;
    fitHeightLabel?: string;
    fitWholeLabel?: string;
    /** Read when the viewer takes focus. */
    keyboardHint?: string;
    /** The zoom level, shown between the buttons and announced when it changes. */
    zoomText?: (percent: number) => string;
    /** Announced when a region is selected from outside the viewer or with the pointer. */
    selectedText?: (region: ImageRegion) => string;
    onRegionClick?: (region: ImageRegion, event: MouseEvent) => void;
    onRegionHover?: (region: ImageRegion | null) => void;
    onSelectedRegionChange?: (region: ImageRegion | null) => void;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    src,
    srcset,
    alt,
    width,
    height,
    regions = [],
    selectedRegionId = $bindable(null),
    hoveredRegionId = $bindable(null),
    fit = 'contain',
    minScale = 1,
    maxScale = 4,
    showControls = true,
    label = 'Image viewer',
    regionsLabel = 'Regions',
    controlsLabel = 'Zoom',
    zoomInLabel = 'Zoom in',
    zoomOutLabel = 'Zoom out',
    fitWidthLabel = 'Fit width',
    fitHeightLabel = 'Fit height',
    fitWholeLabel = 'Fit whole image',
    keyboardHint = 'Plus and minus zoom, arrow keys pan, 0 fits the image again.',
    zoomText = (percent) => `${percent}%`,
    selectedText = (region) => `${region.label}, selected`,
    onRegionClick,
    onRegionHover,
    onSelectedRegionChange,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // The zoom engine is configured once; changing these props later has no effect.
  const zoom = untrack(() =>
    createMediaZoom({
      minScale,
      maxScale,
      fit,
      stepFactor: 1.25,
      doubleTapScale: 1,
      zoomToPointer: true,
      wheelPan: true,
    })
  );

  const uid = $props.id();
  const hintId = `${uid}-hint`;
  let message = $state('');
  let loaded = $state(false);
  /** The region holding the list's single tab stop. */
  let activeId = $state<string | null>(null);

  const size = $derived(zoom.contentSize);
  const percent = $derived(Math.round(zoom.scale * 100));
  const selectedRegion = $derived(regions.find((region) => region.id === selectedRegionId) ?? null);
  const tabStop = $derived(
    regions.find((region) => region.id === activeId)?.id ??
      selectedRegion?.id ??
      regions[0]?.id ??
      null
  );

  // A size given up front is used at once; otherwise the image's own, once it has loaded.
  $effect(() => {
    if (width && height) zoom.setContentSize(width, height);
  });

  const readSize = (image: HTMLImageElement) => {
    if (!image.naturalWidth || !image.naturalHeight) return;
    loaded = true;
    if (!(width && height)) zoom.setContentSize(image.naturalWidth, image.naturalHeight);
  };
  /** A cached image can finish loading before the `load` listener exists. */
  const watchImage: Attachment<HTMLImageElement> = (image) => {
    if (!image.complete) return;
    if (image.naturalWidth) readSize(image);
    // Complete but not yet decoded (an SVG, say): its size is known once decoding settles.
    else
      image.decode?.().then(
        () => readSize(image),
        () => {}
      );
  };

  // Selecting from outside (a neighbouring list) brings the region into view.
  $effect(() => {
    const region = selectedRegion;
    if (!region || !size) return;
    untrack(() => {
      zoom.reveal(region);
      // Focus on the region already says "selected"; anything else is said once, here.
      if (document.activeElement?.getAttribute('data-region-id') !== region.id) {
        message = selectedText(region);
      }
    });
  });

  function select(region: ImageRegion) {
    if (selectedRegionId === region.id) return;
    selectedRegionId = region.id;
    onSelectedRegionChange?.(region);
  }

  function hover(region: ImageRegion | null) {
    hoveredRegionId = region?.id ?? null;
    onRegionHover?.(region);
  }

  /** Run a zoom command and say where it landed. */
  function act(command: () => void) {
    command();
    message = zoomText(Math.round(zoom.scale * 100));
  }

  const PAN_STEP = 48;

  function handleKeydown(event: KeyboardEvent) {
    const fromRegion = event.target !== event.currentTarget;
    const handled = (() => {
      if (event.key === '+' || event.key === '=') act(zoom.zoomIn);
      else if (event.key === '-' || event.key === '_') act(zoom.zoomOut);
      else if (event.key === '0') act(zoom.reset);
      else if (fromRegion) return false;
      else if (event.key.startsWith('Arrow')) {
        const distance = PAN_STEP * (event.shiftKey ? 4 : 1);
        const [dx, dy] = {
          ArrowLeft: [distance, 0],
          ArrowRight: [-distance, 0],
          ArrowUp: [0, distance],
          ArrowDown: [0, -distance],
        }[event.key] ?? [0, 0];
        zoom.pan(dx, dy);
      } else return false;
      return true;
    })();
    if (handled) event.preventDefault();
  }

  /** Arrow keys walk the regions in the order given; Home and End jump to either end. */
  function handleRegionKeydown(event: KeyboardEvent) {
    const list = event.currentTarget as HTMLElement;
    const current = regions.findIndex((region) => region.id === activeId);
    const last = regions.length - 1;
    let next: number;
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown')
      next = current < last ? current + 1 : 0;
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp')
      next = current > 0 ? current - 1 : last;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else if (event.key === 'Escape' && selectedRegionId !== null) {
      event.stopPropagation();
      selectedRegionId = null;
      onSelectedRegionChange?.(null);
      return;
    } else return;
    event.preventDefault();
    event.stopPropagation();
    const region = regions[next];
    activeId = region.id;
    // Pan first, then focus without letting the browser scroll anything itself.
    zoom.reveal(region);
    list.querySelector<HTMLElement>(`[data-region-id="${CSS.escape(region.id)}"]`)?.focus({
      preventScroll: true,
    });
  }

  const regionStyle = (region: ImageRegion) =>
    size
      ? `left:${(region.x / size.width) * 100}%;top:${(region.y / size.height) * 100}%;` +
        `width:${(region.width / size.width) * 100}%;height:${(region.height / size.height) * 100}%`
      : undefined;
</script>

<div bind:this={ref} class={cx('ldt-image-viewer', className)} {...rest}>
  {#if showControls}
    <div
      class="ldt-image-viewer__controls"
      role="toolbar"
      aria-label={controlsLabel}
      {@attach rovingFocus()}
    >
      <button
        type="button"
        class="ldt-button ldt-button--ghost ldt-button--sm ldt-icon-button"
        aria-label={zoomOutLabel}
        disabled={!zoom.canZoomOut}
        data-roving-item
        onclick={() => act(zoom.zoomOut)}><span aria-hidden="true">−</span></button
      >
      <span class="ldt-image-viewer__level" aria-hidden="true">{zoomText(percent)}</span>
      <button
        type="button"
        class="ldt-button ldt-button--ghost ldt-button--sm ldt-icon-button"
        aria-label={zoomInLabel}
        disabled={!zoom.canZoomIn}
        data-roving-item
        onclick={() => act(zoom.zoomIn)}><span aria-hidden="true">+</span></button
      >
      {#each [['width', fitWidthLabel], ['height', fitHeightLabel], ['contain', fitWholeLabel]] as const as [mode, text] (mode)}
        <button
          type="button"
          class="ldt-button ldt-button--ghost ldt-button--sm"
          aria-pressed={zoom.fitMode === mode}
          data-roving-item
          onclick={() => act(() => zoom.fit(mode))}>{text}</button
        >
      {/each}
    </div>
  {/if}
  <!-- A focusable group: it takes the zoom and pan keys. -->
  <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
  <div
    class="ldt-image-viewer__frame"
    role="group"
    aria-label={label}
    aria-describedby={hintId}
    tabindex="0"
    data-pannable={zoom.pannable ? '' : undefined}
    {@attach zoom.attach}
    onkeydown={handleKeydown}
  >
    <div
      class="ldt-image-viewer__layer"
      data-ready={size && (loaded || (width && height)) ? '' : undefined}
      style:width={size ? `${size.width * zoom.scale}px` : undefined}
      style:height={size ? `${size.height * zoom.scale}px` : undefined}
      style:transform={size ? `translate(${zoom.x}px, ${zoom.y}px)` : undefined}
    >
      <img
        class="ldt-image-viewer__image"
        {src}
        {srcset}
        {alt}
        {width}
        {height}
        draggable="false"
        onload={(event) => readSize(event.currentTarget as HTMLImageElement)}
        {@attach watchImage}
      />
      {#if regions.length}
        <!-- The options themselves are the tab stops (one at a time); the list never takes focus. -->
        <!-- svelte-ignore a11y_interactive_supports_focus -->
        <div
          class="ldt-image-viewer__regions"
          role="listbox"
          aria-label={regionsLabel}
          onkeydown={handleRegionKeydown}
        >
          {#each regions as region (region.id)}
            <button
              type="button"
              class={cx(
                'ldt-image-viewer__region',
                region.variant &&
                  region.variant !== 'default' &&
                  `ldt-image-viewer__region--${region.variant}`
              )}
              role="option"
              aria-selected={region.id === selectedRegionId}
              aria-label={region.label}
              tabindex={region.id === tabStop ? 0 : -1}
              data-region-id={region.id}
              data-hovered={region.id === hoveredRegionId ? '' : undefined}
              style={regionStyle(region)}
              onfocus={() => {
                activeId = region.id;
                zoom.reveal(region);
              }}
              onclick={(event) => {
                select(region);
                onRegionClick?.(region, event);
              }}
              onpointerenter={() => hover(region)}
              onpointerleave={() => hover(null)}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  </div>
  <p id={hintId} class="ldt-sr-only">{keyboardHint}</p>
  <LiveRegion {message} />
</div>
