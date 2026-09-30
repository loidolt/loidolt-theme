import { mapColors, type MapColors } from '@loidolt/theme-tokens';
import type { LngLat } from './types.js';

/*
 * Clustering is a GeoJSON source option (`cluster` on `MapSource`). These build the paint for
 * the cluster circles and handle the one interaction every cluster needs: click to zoom in.
 */

/**
 * Cluster colour by size, stepping through the sequential ramp at the given point counts: the
 * more points, the further along the ramp.
 */
export function clusterColor(
  colors: Pick<MapColors, 'sequential'> = mapColors(),
  steps: number[] = [10, 50, 200]
): unknown[] {
  const ramp = colors.sequential.slice(-(steps.length + 1));
  return [
    'step',
    ['get', 'point_count'],
    ramp[0],
    ...steps.flatMap((step, index) => [step, ramp[index + 1] ?? ramp.at(-1)]),
  ];
}

/** Cluster radius by size, in pixels, at the same point counts. */
export function clusterRadius(
  steps: number[] = [10, 50, 200],
  radii: number[] = [14, 18, 24, 30]
): unknown[] {
  return [
    'step',
    ['get', 'point_count'],
    radii[0],
    ...steps.flatMap((step, index) => [step, radii[index + 1] ?? radii.at(-1)]),
  ];
}

/** Whether a rendered feature is a cluster rather than one point. */
export const isCluster = (feature: { properties?: Record<string, unknown> | null }): boolean =>
  feature.properties?.cluster === true && typeof feature.properties.cluster_id === 'number';

interface ClusterSource {
  getClusterExpansionZoom(clusterId: number): Promise<number>;
}

interface ClusterMap {
  getSource(id: string): unknown;
  easeTo(options: { center: LngLat; zoom: number; duration?: number }): void;
}

/**
 * Zooms to where a clicked cluster splits apart. `animate: false` for reduced motion.
 * Resolves `false` when the feature is not a cluster or its source cannot expand it.
 */
export async function expandCluster(
  map: ClusterMap,
  sourceId: string,
  feature: {
    properties?: Record<string, unknown> | null;
    geometry?: { type: string; coordinates?: unknown } | null;
  },
  { animate = true }: { animate?: boolean } = {}
): Promise<boolean> {
  const source = map.getSource(sourceId) as Partial<ClusterSource> | undefined;
  if (!isCluster(feature) || typeof source?.getClusterExpansionZoom !== 'function') return false;
  if (feature.geometry?.type !== 'Point') return false;
  const zoom = await source.getClusterExpansionZoom(feature.properties!.cluster_id as number);
  const [lng, lat] = feature.geometry.coordinates as number[];
  map.easeTo({ center: [lng, lat], zoom, duration: animate ? undefined : 0 });
  return true;
}
