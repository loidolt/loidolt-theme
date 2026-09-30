import { untrack } from 'svelte';
import type { MapLayerMouseEvent } from 'maplibre-gl';
import type { MapColors } from '@loidolt/theme-tokens';
import { changedProperties, deepEqual } from '../core/equality.js';
import type { Feature, LayerFeatureEvent } from '../core/types.js';
import { getSourceContext, requireMapContext } from './context.js';
import { safely } from './safely.js';

export type LayerPaint = Record<string, unknown>;

/** What every layer component accepts. */
export interface LayerProps {
  /** Unique on the map. */
  id: string;
  /** The source to draw from. Defaults to the enclosing `MapSource`. */
  source?: string;
  /** For vector tiles: which layer of the tiles to draw. */
  sourceLayer?: string;
  /** Draw beneath this layer rather than on top of everything. */
  beforeId?: string;
  /** A MapLibre filter expression. */
  filter?: unknown[];
  minZoom?: number;
  maxZoom?: number;
  visible?: boolean;
  /**
   * MapLibre paint properties, merged over this layer type's themed defaults. Pass a function
   * of the theme colours to have them follow light and dark.
   */
  paint?: LayerPaint | ((colors: MapColors) => LayerPaint);
  /** MapLibre layout properties. */
  layout?: Record<string, unknown>;
  /** Names the layer in `LayerManager`. Defaults to `id`. */
  label?: string;
  /** A click on a feature of this layer. */
  onClick?: (event: LayerFeatureEvent) => void;
  /** The pointer entering a feature of this layer, or `null` as it leaves. */
  onHover?: (event: LayerFeatureEvent | null) => void;
}

type Defaults = (colors: MapColors) => { paint?: LayerPaint; layout?: Record<string, unknown> };

const toEvent = (event: MapLayerMouseEvent): LayerFeatureEvent => ({
  feature: event.features![0] as unknown as LayerFeatureEvent['feature'],
  features: (event.features ?? []) as unknown as Feature[],
  lngLat: [event.lngLat.lng, event.lngLat.lat],
  point: [event.point.x, event.point.y],
});

/**
 * Adds a layer of `type` to the enclosing map and keeps it in step with its props: added on
 * every style load, diffed on every change (only what changed is sent), recoloured on a theme
 * change, removed on unmount.
 */
export function useLayer(type: string, props: () => LayerProps, defaults: Defaults = () => ({})) {
  const context = requireMapContext(`${type} layer`);
  const enclosing = getSourceContext();
  let added = $state(false);
  let applied: {
    paint?: LayerPaint;
    layout?: Record<string, unknown>;
    filter?: unknown[];
    zoom?: [number, number];
    beforeId?: string;
  } = {};

  const resolve = (current: LayerProps, colors: MapColors) => {
    const base = defaults(colors);
    const own = typeof current.paint === 'function' ? current.paint(colors) : current.paint;
    return {
      paint: { ...base.paint, ...own },
      layout: {
        ...base.layout,
        ...current.layout,
        visibility: current.visible === false ? 'none' : 'visible',
      },
    };
  };

  // Settled through deriveds: only a real change of id or source re-creates the layer.
  const layerId = $derived(props().id);
  const namedSource = $derived(props().source);

  $effect(() => {
    const target = context.map;
    const [id, named] = [layerId, namedSource];
    const sourceId = named ?? enclosing?.id;
    void context.styleVersion;
    const sourceReady = named ? true : Boolean(enclosing?.ready);
    if (!target || !context.loaded || !sourceReady) return;
    if (!sourceId && type !== 'background') {
      throw new Error(
        `Layer "${id}" has no source: pass \`source\` or place it inside <MapSource>.`
      );
    }

    let waiting: (() => void) | undefined;
    const add = () => {
      if (sourceId && !target.getSource(sourceId)) return false;
      untrack(() => {
        const current = props();
        const { paint, layout } = resolve(current, context.colors);
        if (!target.getLayer(id)) {
          const before =
            current.beforeId && target.getLayer(current.beforeId) ? current.beforeId : undefined;
          target.addLayer(
            {
              id,
              type,
              ...(sourceId ? { source: sourceId } : {}),
              ...(current.sourceLayer ? { 'source-layer': current.sourceLayer } : {}),
              ...(current.filter ? { filter: current.filter } : {}),
              ...(current.minZoom !== undefined ? { minzoom: current.minZoom } : {}),
              ...(current.maxZoom !== undefined ? { maxzoom: current.maxZoom } : {}),
              paint,
              layout,
            } as never,
            before
          );
        }
        applied = {
          paint,
          layout,
          filter: current.filter,
          zoom: [current.minZoom ?? 0, current.maxZoom ?? 24],
          beforeId: current.beforeId,
        };
      });
      added = true;
      return true;
    };

    if (!add()) {
      // A source named outside any MapSource may not exist yet; wait for it.
      waiting = () => {
        if (add()) target.off('sourcedata', waiting!);
      };
      target.on('sourcedata', waiting);
    }
    // Registering writes the map's layer list, which this effect must not come to depend on.
    const unregister = untrack(() =>
      context.registerLayer({ id, label: props().label ?? id, type })
    );

    return () => {
      added = false;
      untrack(unregister);
      safely(() => {
        if (waiting) target.off('sourcedata', waiting);
        if (target.getLayer(id)) target.removeLayer(id);
      });
    };
  });

  // Everything after creation: diffed, so a re-render sends only what changed.
  $effect(() => {
    const current = props();
    const colors = context.colors;
    const target = context.map;
    if (!added || !target) return;
    const { id } = current;
    const { paint, layout } = resolve(current, colors);
    for (const [name, value] of changedProperties(applied.paint, paint)) {
      target.setPaintProperty(id, name as never, (value ?? null) as never);
    }
    for (const [name, value] of changedProperties(applied.layout, layout)) {
      target.setLayoutProperty(id, name as never, (value ?? null) as never);
    }
    if (!deepEqual(applied.filter, current.filter))
      target.setFilter(id, (current.filter ?? null) as never);
    const zoom: [number, number] = [current.minZoom ?? 0, current.maxZoom ?? 24];
    if (!deepEqual(applied.zoom, zoom)) target.setLayerZoomRange(id, zoom[0], zoom[1]);
    if (current.beforeId !== applied.beforeId) {
      target.moveLayer(
        id,
        current.beforeId && target.getLayer(current.beforeId) ? current.beforeId : undefined
      );
    }
    applied = { paint, layout, filter: current.filter, zoom, beforeId: current.beforeId };
  });

  // Pointer events. Handlers read the latest props when they fire.
  $effect(() => {
    const target = context.map;
    const id = layerId;
    if (!added || !target) return;
    let hovered: { source: string; sourceLayer?: string; id: string | number } | null = null;

    const clearHover = () => {
      if (hovered) safely(() => target.setFeatureState(hovered!, { hover: false }));
      hovered = null;
    };
    const click = (event: MapLayerMouseEvent) => {
      if (event.features?.length) props().onClick?.(toEvent(event));
    };
    const move = (event: MapLayerMouseEvent) => {
      const feature = event.features?.[0];
      if (!feature) return;
      const current = props();
      if (current.onClick) target.getCanvas().style.cursor = 'pointer';
      if (feature.id !== undefined && feature.id !== hovered?.id) {
        clearHover();
        hovered = {
          source: feature.source,
          ...(feature.sourceLayer ? { sourceLayer: feature.sourceLayer } : {}),
          id: feature.id,
        };
        target.setFeatureState(hovered, { hover: true });
      }
      current.onHover?.(toEvent(event));
    };
    const leave = () => {
      target.getCanvas().style.cursor = '';
      clearHover();
      props().onHover?.(null);
    };

    target.on('click', id, click);
    target.on('mousemove', id, move);
    target.on('mouseleave', id, leave);
    return () =>
      safely(() => {
        clearHover();
        target.off('click', id, click);
        target.off('mousemove', id, move);
        target.off('mouseleave', id, leave);
      });
  });

  return {
    get added() {
      return added;
    },
  };
}
