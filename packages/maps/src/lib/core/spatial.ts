import RBush from 'rbush';
import { boundsOf } from './bounds.js';
import type { Feature, FeatureCollection, LngLat, LngLatBounds } from './types.js';

/*
 * A spatial index over features, for the questions a busy map keeps asking: what is in view,
 * what is near this point. Backed by an R-tree (rbush), so both stay fast into the hundreds of
 * thousands of features.
 */

interface Entry {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  id: string | number;
  feature: Feature;
}

export interface SpatialIndex<P = Record<string, unknown>> {
  readonly size: number;
  /** Replaces everything in the index. Bulk loading is much faster than inserting one by one. */
  load(features: Array<Feature<P>> | FeatureCollection<P>): void;
  insert(feature: Feature<P>): void;
  remove(id: string | number): boolean;
  clear(): void;
  /** Features whose bounding box overlaps `bounds`, up to `limit`. */
  search(bounds: LngLatBounds, options?: { limit?: number }): Array<Feature<P>>;
  /** The `count` features whose boxes are nearest `point`, nearest first. */
  nearest(point: LngLat, count?: number): Array<Feature<P>>;
}

export interface SpatialIndexOptions<P> {
  /** A stable id for a feature. Defaults to `feature.id`, then its position in the input. */
  getId?: (feature: Feature<P>, index: number) => string | number;
}

/** A spatial index over features. Features with no geometry are skipped. */
export function createSpatialIndex<P = Record<string, unknown>>(
  options: SpatialIndexOptions<P> = {}
): SpatialIndex<P> {
  const tree = new RBush<Entry>();
  const byId = new Map<string | number, Entry>();
  let counter = 0;
  const idOf = (feature: Feature<P>) =>
    options.getId?.(feature, counter) ?? feature.id ?? `feature-${counter}`;

  const entry = (feature: Feature<P>): Entry | null => {
    const box = boundsOf(feature as Feature);
    const id = idOf(feature);
    counter += 1;
    if (!box) return null;
    const [[minX, minY], [maxX, maxY]] = box;
    return { minX, minY, maxX, maxY, id, feature: feature as Feature };
  };

  const distanceTo = ([x, y]: LngLat, item: Entry) => {
    const dx = Math.max(item.minX - x, 0, x - item.maxX);
    const dy = Math.max(item.minY - y, 0, y - item.maxY);
    return dx * dx + dy * dy;
  };

  return {
    get size() {
      return byId.size;
    },
    load(input) {
      tree.clear();
      byId.clear();
      counter = 0;
      const features = Array.isArray(input) ? input : input.features;
      const entries = features.map(entry).filter((item): item is Entry => item !== null);
      for (const item of entries) byId.set(item.id, item);
      tree.load(entries);
    },
    insert(feature) {
      const item = entry(feature);
      if (!item) return;
      const existing = byId.get(item.id);
      if (existing) tree.remove(existing);
      byId.set(item.id, item);
      tree.insert(item);
    },
    remove(id) {
      const existing = byId.get(id);
      if (!existing) return false;
      tree.remove(existing);
      byId.delete(id);
      return true;
    },
    clear() {
      tree.clear();
      byId.clear();
      counter = 0;
    },
    search([[minX, minY], [maxX, maxY]], { limit = Infinity } = {}) {
      return tree
        .search({ minX, minY, maxX, maxY })
        .slice(0, limit)
        .map((item) => item.feature as Feature<P>);
    },
    nearest(point, count = 1) {
      // Widen the search box until it holds enough candidates, then rank them exactly.
      const all = byId.size;
      if (!all) return [];
      let radius = 0.01;
      let found: Entry[] = [];
      while (found.length < Math.min(count, all) && radius < 720) {
        found = tree.search({
          minX: point[0] - radius,
          minY: point[1] - radius,
          maxX: point[0] + radius,
          maxY: point[1] + radius,
        });
        radius *= 4;
      }
      return found
        .sort((a, b) => distanceTo(point, a) - distanceTo(point, b))
        .slice(0, count)
        .map((item) => item.feature as Feature<P>);
    },
  };
}
