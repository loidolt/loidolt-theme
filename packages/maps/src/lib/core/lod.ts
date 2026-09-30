import { convexHull, simplifyFeatures } from './simplify.js';
import { coordinatesOf } from './bounds.js';
import type { Feature, FeatureCollection, LngLat } from './types.js';

/*
 * Level of detail: draw less when zoomed out. Shapes are simplified to what a pixel can show at
 * the current zoom, and a group of features can collapse into its outline.
 */

/**
 * The simplification tolerance, in degrees, that keeps error under `pixels` at `zoom` — about
 * the width of one screen pixel of longitude at the equator.
 */
export function toleranceForZoom(zoom: number, { pixels = 1, tileSize = 512 } = {}): number {
  return (360 / (tileSize * 2 ** zoom)) * pixels;
}

export interface LevelOfDetail<P> {
  /** The collection simplified for `zoom`, cached per whole zoom level. */
  at(zoom: number): FeatureCollection<P>;
  clear(): void;
}

/**
 * Precomputes nothing; simplifies on demand and caches per whole zoom level, so panning at one
 * zoom costs nothing and zooming costs one pass. At `maxZoom` and above the data is untouched.
 */
export function createLevelOfDetail<P>(
  collection: FeatureCollection<P>,
  { pixels = 1, maxZoom = 16 }: { pixels?: number; maxZoom?: number } = {}
): LevelOfDetail<P> {
  const cache = new Map<number, FeatureCollection<P>>();
  return {
    at(zoom) {
      const level = Math.max(0, Math.floor(zoom));
      if (level >= maxZoom) return collection;
      let simplified = cache.get(level);
      if (!simplified) {
        simplified = simplifyFeatures(collection, toleranceForZoom(level, { pixels }));
        cache.set(level, simplified);
      }
      return simplified;
    },
    clear: () => cache.clear(),
  };
}

/**
 * A group of features as one outline — the convex hull of every coordinate — for drawing a
 * whole set as a single shape when zoomed far out. `null` for fewer than three distinct points.
 */
export function outlineOf<P extends Record<string, unknown>>(
  features: Array<Feature>,
  properties: P = {} as P
): Feature<P> | null {
  const points: LngLat[] = [];
  for (const feature of features) {
    for (const position of coordinatesOf(feature)) points.push([position[0], position[1]]);
  }
  const hull = convexHull(points);
  if (hull.length < 4) return null;
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [hull] }, properties };
}
