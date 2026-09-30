<script lang="ts">
  import { untrack, type Snippet } from 'svelte';
  import type { GeoJSONSource } from 'maplibre-gl';
  import type { GeoJSON } from '../core/types.js';
  import { requireMapContext, setSourceContext } from '../internal/context.js';
  import { safely } from '../internal/safely.js';

  interface ClusterOptions {
    /** Pixel radius points gather within. */
    radius?: number;
    /** The zoom at which clusters stop forming. */
    maxZoom?: number;
    /** The fewest points that make a cluster. */
    minPoints?: number;
    /** Aggregates kept on each cluster, as MapLibre `clusterProperties`. */
    properties?: Record<string, unknown>;
  }

  interface Props {
    /** Unique on the map; layers name it as their `source`. */
    id: string;
    /** GeoJSON, or a URL to fetch it from. Replace the object to update the map. */
    data?: GeoJSON | string;
    /** Any other MapLibre source — vector or raster tiles, an image — as its specification. */
    spec?: Record<string, unknown>;
    /** Gather nearby points into clusters. */
    cluster?: boolean | ClusterOptions;
    /** A feature property to use as its id, for hover state and `LayerManager`. */
    promoteId?: string;
    /** Credit shown in the attribution control. */
    attribution?: string;
    /** Layers drawn from this source. They pick up its id without naming it. */
    children?: Snippet;
  }

  let { id, data, spec, cluster = false, promoteId, attribution, children }: Props = $props();

  const context = requireMapContext('MapSource');
  let ready = $state(false);
  let applied: unknown = undefined;

  setSourceContext({
    get id() {
      return id;
    },
    get ready() {
      return ready;
    },
  });

  function specification(): Record<string, unknown> {
    if (spec) return { ...spec, ...(attribution ? { attribution } : {}) };
    const options = typeof cluster === 'object' ? cluster : {};
    return {
      type: 'geojson',
      data: data ?? { type: 'FeatureCollection', features: [] },
      ...(cluster
        ? {
            cluster: true,
            clusterRadius: options.radius ?? 50,
            clusterMaxZoom: options.maxZoom ?? 14,
            clusterMinPoints: options.minPoints ?? 2,
            ...(options.properties ? { clusterProperties: options.properties } : {}),
          }
        : {}),
      ...(promoteId ? { promoteId } : {}),
      ...(attribution ? { attribution } : {}),
    };
  }

  // Added once per style: a basemap swap drops every source, and `styleVersion` says so.
  $effect(() => {
    const target = context.map;
    const sourceId = id;
    void context.styleVersion;
    if (!target || !context.loaded) return;
    untrack(() => {
      if (!target.getSource(sourceId)) target.addSource(sourceId, specification() as never);
      applied = data;
    });
    ready = true;
    // A style swap re-runs this after dropping the source, and layers waiting on it pick it up
    // as soon as it is back; only unmounting (below) takes `ready` away.
    return () => {
      safely(() => {
        // Layers go first: MapLibre refuses to remove a source that is still drawn from.
        for (const layer of target.getStyle()?.layers ?? []) {
          if ('source' in layer && layer.source === sourceId) target.removeLayer(layer.id);
        }
        if (target.getSource(sourceId)) target.removeSource(sourceId);
      });
    };
  });

  $effect(() => () => {
    ready = false;
  });

  // New data replaces the old in place; the layers drawing it are untouched.
  $effect(() => {
    const next = data;
    if (!ready || next === applied || next === undefined) return;
    applied = next;
    const source = context.map?.getSource(id) as GeoJSONSource | undefined;
    source?.setData?.(next as never);
  });
</script>

{#if ready}{@render children?.()}{/if}
