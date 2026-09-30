import { createLevelOfDetail, type LevelOfDetail } from '../lod.js';
import { createSpatialIndex } from '../spatial.js';
import type { FeatureCollection } from '../types.js';
import type { SpatialRequest, SpatialResponse } from './protocol.js';

/**
 * Answers spatial requests. The worker runs this; so does the client itself, on the main thread,
 * wherever a worker cannot start — the answers are the same either way.
 */
export function createSpatialHandler(): (request: SpatialRequest) => SpatialResponse {
  let index = createSpatialIndex();
  let collection: FeatureCollection = { type: 'FeatureCollection', features: [] };
  let detail: LevelOfDetail<Record<string, unknown>> | null = null;

  return (request) => {
    try {
      switch (request.type) {
        case 'load': {
          const property = request.idProperty;
          index = createSpatialIndex({
            getId: property
              ? (feature, position) =>
                  (feature.properties?.[property] as string | number) ?? position
              : undefined,
          });
          index.load(request.features);
          collection = request.features;
          detail = null;
          return { id: request.id, ok: true, result: index.size };
        }
        case 'search':
          return {
            id: request.id,
            ok: true,
            result: index.search(request.bounds, { limit: request.limit }),
          };
        case 'nearest':
          return { id: request.id, ok: true, result: index.nearest(request.point, request.count) };
        case 'simplify':
          detail ??= createLevelOfDetail(collection, { pixels: request.pixels });
          return { id: request.id, ok: true, result: detail.at(request.zoom) };
        default:
          return {
            id: (request as { id: number }).id,
            ok: false,
            error: `Unknown request "${(request as { type: string }).type}"`,
          };
      }
    } catch (error) {
      return {
        id: request.id,
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  };
}
