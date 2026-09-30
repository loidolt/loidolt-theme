<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Map as MapLibreMap, MapMouseEvent } from 'maplibre-gl';
  import { mapRoles } from '@loidolt/theme-tokens';
  import {
    Alert,
    LiveRegion,
    createAnnouncer,
    createMediaQuery,
    createTokenColors,
    cx,
  } from '@loidolt/theme-svelte';
  import { formatMoveAnnouncement, describeMapKeys } from '../core/accessibility.js';
  import {
    basemapPaint,
    createBasemapStyle,
    createBlankStyle,
    OPENFREEMAP_ATTRIBUTION,
    OPENFREEMAP_GLYPHS,
    OPENFREEMAP_TILES,
  } from '../core/style.js';
  import type {
    LngLat,
    LngLatBounds,
    MapClickEvent,
    MapViewState,
    StyleSpecification,
  } from '../core/types.js';
  import { setMapContext, type LayerEntry } from '../internal/context.js';
  import { loadMapLibre, type MapLibreModule } from '../maplibre.js';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'onclick' | 'onerror'> {
    /** Names the map for assistive tech — say what it shows, e.g. "Delivery stops". */
    label: string;
    /**
     * What the map shows, read after the label. The keyboard controls are appended, so a
     * screen-reader user knows the map can be moved.
     */
    description?: string;
    /** `[longitude, latitude]`. Bindable: follows the map as it moves. */
    center?: LngLat;
    /** Bindable: follows the map as it zooms. */
    zoom?: number;
    bearing?: number;
    pitch?: number;
    /** Fit the view to this box on load and whenever it changes. Wins over `center`/`zoom`. */
    bounds?: LngLatBounds;
    /** Space kept around `bounds`, in pixels. */
    boundsPadding?: number;
    minZoom?: number;
    maxZoom?: number;
    /** Keep the view inside this box. */
    maxBounds?: LngLatBounds;
    /**
     * `default` draws the loidolt basemap from OpenMapTiles-schema tiles (OpenFreeMap's unless
     * `tiles` says otherwise); `blank` draws land colour only, with no network requests.
     * Bindable, so a `BasemapSwitcher` can drive it.
     */
    basemap?: string;
    /** A style URL or document of your own. Overrides `basemap`, and is not recoloured. */
    mapStyle?: string | StyleSpecification;
    /** OpenMapTiles-schema tiles for the default basemap: a TileJSON URL or `{z}/{x}/{y}` template. */
    tiles?: string;
    /** Glyph URL template for labels. */
    glyphs?: string;
    /** Attribution for `tiles`. Required by most tile providers — OpenFreeMap's is the default. */
    attribution?: string;
    /** Pan and zoom by pointer and keyboard. */
    interactive?: boolean;
    /** Require two fingers or Ctrl + wheel to move the map, so it cannot trap page scrolling. */
    cooperativeGestures?: boolean;
    navigationControl?: boolean;
    scaleControl?: boolean;
    scaleUnit?: 'metric' | 'imperial';
    fullscreenControl?: boolean;
    geolocateControl?: boolean;
    /** Corner for the built-in controls. */
    controlPosition?: Corner;
    /** Map height: pixels, or any CSS length. */
    height?: number | string;
    /**
     * Announce where the map lands after a keyboard pan or zoom — the non-visual answer to
     * "where am I now?".
     */
    announceMoves?: boolean;
    /** Shown when the map cannot be drawn at all (no WebGL, or MapLibre failed to load). */
    unavailableText?: string;
    errorTitle?: string;
    onLoad?: (map: MapLibreMap) => void;
    onClick?: (event: MapClickEvent) => void;
    onMoveEnd?: (view: MapViewState) => void;
    onError?: (error: Error) => void;
    /** Sources, layers, markers and controls. Rendered once the style has loaded. */
    children?: Snippet;
    /** The live MapLibre map. Bindable; `null` until created. */
    map?: MapLibreMap | null;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  const id = $props.id();

  let {
    label,
    description,
    center = $bindable([0, 20]),
    zoom = $bindable(1.5),
    bearing = 0,
    pitch = 0,
    bounds,
    boundsPadding = 32,
    minZoom,
    maxZoom,
    maxBounds,
    basemap = $bindable('default'),
    mapStyle,
    tiles = OPENFREEMAP_TILES,
    glyphs = OPENFREEMAP_GLYPHS,
    attribution = OPENFREEMAP_ATTRIBUTION,
    interactive = true,
    cooperativeGestures = false,
    navigationControl = true,
    scaleControl = false,
    scaleUnit = 'metric',
    fullscreenControl = false,
    geolocateControl = false,
    controlPosition = 'top-right',
    height = 400,
    announceMoves = true,
    unavailableText = 'The map could not be shown in this browser.',
    errorTitle = 'Map unavailable',
    onLoad,
    onClick,
    onMoveEnd,
    onError,
    children,
    map = $bindable(null),
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let container = $state<HTMLDivElement | null>(null);
  let instance = $state.raw<MapLibreMap | null>(null);
  let lib = $state.raw<MapLibreModule | null>(null);
  let loaded = $state(false);
  let styleVersion = $state(0);
  let failure = $state<string | null>(null);
  let layers = $state.raw<LayerEntry[]>([]);
  /** A style chosen through `setBasemap` with a document of its own. */
  let customBasemap = $state.raw<string | StyleSpecification | null>(null);

  const palette = createTokenColors(mapRoles, { element: () => ref });
  const reducedMotion = createMediaQuery('(prefers-reduced-motion: reduce)');
  const announcer = createAnnouncer();

  const descriptionId = `${id}-description`;
  const cssHeight = $derived(typeof height === 'number' ? `${height}px` : height);
  const fullDescription = $derived([description, describeMapKeys()].filter(Boolean).join(' '));

  /** The style to show, before colours: recomputed only when the choice itself changes. */
  const styleChoice = $derived.by(() => {
    if (mapStyle) return { kind: 'custom' as const, value: mapStyle };
    if (customBasemap) return { kind: 'custom' as const, value: customBasemap };
    return {
      kind: basemap === 'blank' ? ('blank' as const) : ('default' as const),
      tiles,
      glyphs,
      attribution,
    };
  });

  function buildStyle(): string | StyleSpecification {
    const choice = styleChoice;
    const colors = untrack(() => palette.colors);
    if (choice.kind === 'custom') return choice.value;
    if (choice.kind === 'blank') return createBlankStyle({ colors, glyphs: choice.glyphs });
    return createBasemapStyle({
      colors,
      tiles: choice.tiles,
      glyphs: choice.glyphs,
      attribution: choice.attribution,
    });
  }

  const viewOf = (target: MapLibreMap): MapViewState => {
    const box = target.getBounds();
    const middle = target.getCenter();
    return {
      center: [middle.lng, middle.lat],
      zoom: target.getZoom(),
      bearing: target.getBearing(),
      pitch: target.getPitch(),
      bounds: [
        [box.getWest(), box.getSouth()],
        [box.getEast(), box.getNorth()],
      ],
    };
  };

  setMapContext({
    get map() {
      return instance;
    },
    get lib() {
      return lib;
    },
    get loaded() {
      return loaded;
    },
    get styleVersion() {
      return styleVersion;
    },
    get colors() {
      return palette.colors;
    },
    get colorVersion() {
      return palette.version;
    },
    get reducedMotion() {
      return reducedMotion.matches;
    },
    get basemap() {
      return basemap;
    },
    setBasemap(next, spec) {
      customBasemap = spec ?? null;
      basemap = next;
    },
    get layers() {
      return layers;
    },
    registerLayer(entry) {
      layers = [...layers.filter((layer) => layer.id !== entry.id), entry];
      return () => {
        layers = layers.filter((layer) => layer !== entry);
      };
    },
  });

  $effect(() => {
    if (ref) untrack(() => palette.refresh());
  });

  // One MapLibre map per mounted container. Everything it is created with is read untracked:
  // later changes flow through the effects below instead of rebuilding the map.
  $effect(() => {
    const element = container;
    if (!element) return;
    let disposed = false;
    let current: MapLibreMap | null = null;
    let announceTimer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      const maplibre = await loadMapLibre();
      if (disposed) return;
      if (!maplibre) {
        failure = unavailableText;
        return;
      }
      const settings = untrack(() => ({
        container: element,
        style: buildStyle() as never,
        center,
        zoom,
        bearing,
        pitch,
        minZoom,
        maxZoom,
        maxBounds,
        interactive,
        cooperativeGestures,
        attributionControl: false as const,
        fadeDuration: reducedMotion.matches ? 0 : 300,
        locale: { 'Map.Title': label },
      }));
      try {
        current = new maplibre.Map(settings);
      } catch (error) {
        failure = unavailableText;
        untrack(() => onError?.(error instanceof Error ? error : new Error(String(error))));
        return;
      }
      const created = current;
      untrack(() => {
        created.addControl(new maplibre.AttributionControl({ compact: true }), 'bottom-right');
        if (navigationControl) {
          created.addControl(
            new maplibre.NavigationControl({ visualizePitch: true }),
            controlPosition
          );
        }
        if (fullscreenControl) {
          created.addControl(
            new maplibre.FullscreenControl({ container: ref ?? undefined }),
            controlPosition
          );
        }
        if (geolocateControl) {
          created.addControl(
            new maplibre.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
            controlPosition
          );
        }
        if (scaleControl) {
          created.addControl(new maplibre.ScaleControl({ unit: scaleUnit }), 'bottom-left');
        }
      });
      created.getCanvas().setAttribute('aria-describedby', descriptionId);

      created.on('style.load', () => {
        styleVersion += 1;
        if (loaded) return;
        loaded = true;
        const box = untrack(() => bounds);
        if (box) created.fitBounds(box, { padding: boundsPadding, animate: false });
        untrack(() => onLoad?.(created));
      });
      created.on('moveend', (event) => {
        const view = viewOf(created);
        center = view.center;
        zoom = view.zoom;
        untrack(() => onMoveEnd?.(view));
        // Only moves made from the keyboard are spoken; pointer users can see where they went.
        if (!(event as { originalEvent?: Event }).originalEvent || !announceMoves) return;
        if (!((event as { originalEvent?: Event }).originalEvent instanceof KeyboardEvent)) return;
        clearTimeout(announceTimer);
        announceTimer = setTimeout(
          () => announcer.announce(formatMoveAnnouncement(view.center, view.zoom)),
          400
        );
      });
      created.on('click', (event: MapMouseEvent) =>
        onClick?.({
          lngLat: [event.lngLat.lng, event.lngLat.lat],
          point: [event.point.x, event.point.y],
          features: created.queryRenderedFeatures(event.point),
        })
      );
      created.on('error', (event) => {
        const error =
          event.error instanceof Error
            ? event.error
            : new Error(event.error?.message ?? 'Map error');
        // Before the style loads nothing can be drawn, so that is fatal. After it, a failed
        // tile or image is not: the rest of the map keeps working.
        if (!untrack(() => loaded)) failure = error.message || unavailableText;
        untrack(() => onError?.(error));
      });

      lib = maplibre;
      instance = created;
      map = created;
    })();

    return () => {
      disposed = true;
      clearTimeout(announceTimer);
      current?.remove();
      instance = null;
      map = null;
      loaded = false;
      layers = [];
    };
  });

  // A new basemap or style: swap it in. Sources and layers re-add themselves on `style.load`.
  let appliedChoice: unknown = null;
  $effect(() => {
    const choice = styleChoice;
    const target = instance;
    if (!target) return;
    if (appliedChoice === null) {
      appliedChoice = choice;
      return;
    }
    if (appliedChoice === choice) return;
    appliedChoice = choice;
    target.setStyle(untrack(() => buildStyle()) as never);
  });

  // A theme change repaints the generated basemap in place: no reload, and data layers stay.
  $effect(() => {
    const colors = palette.colors;
    const target = instance;
    if (!target || !loaded || untrack(() => styleChoice.kind === 'custom')) return;
    for (const [layerId, paint] of Object.entries(basemapPaint(colors))) {
      if (!target.getLayer(layerId)) continue;
      for (const [property, value] of Object.entries(paint)) {
        target.setPaintProperty(layerId, property as never, value as never);
      }
    }
  });

  // Props into the map. A move the map made itself comes back equal, so it is a no-op.
  $effect(() => {
    const target = instance;
    if (!target || !loaded) return;
    const next = { center, zoom, bearing, pitch };
    const now = target.getCenter();
    const moved =
      Math.abs(now.lng - next.center[0]) > 1e-7 ||
      Math.abs(now.lat - next.center[1]) > 1e-7 ||
      Math.abs(target.getZoom() - next.zoom) > 1e-4 ||
      Math.abs(target.getBearing() - next.bearing) > 1e-4 ||
      Math.abs(target.getPitch() - next.pitch) > 1e-4;
    if (!moved) return;
    if (untrack(() => reducedMotion.matches)) target.jumpTo(next);
    else target.easeTo(next);
  });

  let fittedBounds: string | null = null;
  $effect(() => {
    const target = instance;
    const key = bounds ? JSON.stringify(bounds) : null;
    if (!target || !loaded || !bounds) return;
    if (fittedBounds === null) {
      // The load handler made the first fit.
      fittedBounds = key;
      return;
    }
    if (key === fittedBounds) return;
    fittedBounds = key;
    target.fitBounds(bounds, {
      padding: boundsPadding,
      animate: !untrack(() => reducedMotion.matches),
    });
  });

  $effect(() => {
    instance?.getCanvas().setAttribute('aria-label', label);
  });
</script>

<div
  bind:this={ref}
  class={cx('ldt-map', className)}
  style:--ldt-map-height={cssHeight}
  data-loaded={loaded || undefined}
  {...rest}
>
  {#if failure}
    <Alert variant="warning" title={errorTitle} class="ldt-map__alert">{failure}</Alert>
  {/if}
  <div bind:this={container} class="ldt-map__canvas" hidden={Boolean(failure)}></div>
  <p id={descriptionId} class="ldt-sr-only">{fullDescription}</p>
  <LiveRegion message={announcer.message} politeness={announcer.politeness} />
  {#if loaded && instance}
    <div class="ldt-map__children" hidden>{@render children?.()}</div>
  {/if}
</div>
