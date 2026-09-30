import type { FeatureCollection, LngLat, LngLatBounds } from '../types.js';

/** What the spatial worker can be asked. */
export type SpatialRequest =
  | { id: number; type: 'load'; features: FeatureCollection; idProperty?: string }
  | { id: number; type: 'search'; bounds: LngLatBounds; limit?: number }
  | { id: number; type: 'nearest'; point: LngLat; count?: number }
  | { id: number; type: 'simplify'; zoom: number; pixels?: number };

export type SpatialResponse =
  { id: number; ok: true; result: unknown } | { id: number; ok: false; error: string };
