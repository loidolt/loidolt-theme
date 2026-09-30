import { isLngLat } from './bounds.js';
import type { Feature, FeatureCollection, GeoJSON, Geometry, LngLat } from './types.js';

const GEOMETRY_TYPES = new Set([
  'Point',
  'MultiPoint',
  'LineString',
  'MultiLineString',
  'Polygon',
  'MultiPolygon',
  'GeometryCollection',
]);

export interface GeoJSONCheck {
  valid: boolean;
  /** What is wrong, one message per problem, with a path such as `features[3].geometry`. */
  errors: string[];
}

function checkGeometry(value: unknown, path: string, errors: string[]): void {
  if (value === null) return;
  const geometry = value as Geometry;
  if (typeof value !== 'object' || !GEOMETRY_TYPES.has(geometry.type)) {
    errors.push(`${path}: not a GeoJSON geometry`);
    return;
  }
  if (geometry.type === 'GeometryCollection') {
    if (!Array.isArray(geometry.geometries)) errors.push(`${path}.geometries: must be an array`);
    else
      geometry.geometries.forEach((part, index) =>
        checkGeometry(part, `${path}.geometries[${index}]`, errors)
      );
    return;
  }
  const depth = {
    Point: 0,
    MultiPoint: 1,
    LineString: 1,
    MultiLineString: 2,
    Polygon: 2,
    MultiPolygon: 3,
  }[geometry.type];
  const walk = (node: unknown, level: number, where: string): void => {
    if (level === 0) {
      if (!isLngLat(node)) errors.push(`${where}: not a [longitude, latitude] position`);
      return;
    }
    if (!Array.isArray(node)) {
      errors.push(`${where}: must be an array`);
      return;
    }
    node.forEach((child, index) => walk(child, level - 1, `${where}[${index}]`));
  };
  walk(geometry.coordinates, depth, `${path}.coordinates`);
}

/**
 * Checks that a value is GeoJSON a map can draw: known types, and positions that are real
 * `[longitude, latitude]` pairs. The most common mistake it catches is `[lat, lng]` order,
 * which puts a latitude above 90 in the longitude slot.
 */
export function validateGeoJSON(value: unknown): GeoJSONCheck {
  const errors: string[] = [];
  const data = value as GeoJSON;
  if (typeof value !== 'object' || value === null) {
    errors.push('not an object');
  } else if (data.type === 'FeatureCollection') {
    if (!Array.isArray(data.features)) errors.push('features: must be an array');
    else
      data.features.forEach((feature, index) => {
        if (feature?.type !== 'Feature') errors.push(`features[${index}]: not a Feature`);
        else checkGeometry(feature.geometry, `features[${index}].geometry`, errors);
      });
  } else if (data.type === 'Feature') {
    checkGeometry(data.geometry, 'geometry', errors);
  } else {
    checkGeometry(value, 'geometry', errors);
  }
  return { valid: errors.length === 0, errors };
}

export interface LoadOptions {
  signal?: AbortSignal;
  /** Give up after this many milliseconds. */
  timeout?: number;
  /** For tests and custom transports. Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/** Fetches and validates GeoJSON. Rejects with a readable message when either fails. */
export async function loadGeoJSON(url: string, options: LoadOptions = {}): Promise<GeoJSON> {
  const { timeout = 30_000, fetch: request = globalThis.fetch } = options;
  const controller = new AbortController();
  const abort = () => controller.abort();
  options.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeout);
  try {
    const response = await request(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`loadGeoJSON: ${url} answered ${response.status}`);
    const data = await response.json();
    const check = validateGeoJSON(data);
    if (!check.valid)
      throw new Error(`loadGeoJSON: ${url} is not valid GeoJSON (${check.errors[0]})`);
    return data as GeoJSON;
  } catch (error) {
    if (controller.signal.aborted && !options.signal?.aborted) {
      throw new Error(`loadGeoJSON: ${url} took longer than ${timeout} ms`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abort);
  }
}

/** Points as a FeatureCollection, each keeping its own properties. */
export function pointsToFeatureCollection<P extends Record<string, unknown>>(
  points: Array<{ lngLat: LngLat; id?: string | number; properties?: P }>
): FeatureCollection<P> {
  return {
    type: 'FeatureCollection',
    features: points.map(({ lngLat, id, properties }) => ({
      type: 'Feature',
      ...(id === undefined ? {} : { id }),
      geometry: { type: 'Point', coordinates: lngLat },
      properties: properties ?? ({} as P),
    })),
  };
}

/**
 * A representative point for a feature: the point itself, a line's middle vertex, or the
 * average of a shape's outer ring. Good enough to fly to or to pin a label on; not a true
 * centroid for concave shapes.
 */
export function featureAnchor(feature: Feature): LngLat | null {
  const geometry = feature.geometry;
  if (!geometry) return null;
  const average = (ring: number[][]) => {
    const points =
      ring.length > 1 && ring[0][0] === ring.at(-1)![0] && ring[0][1] === ring.at(-1)![1]
        ? ring.slice(0, -1)
        : ring;
    const [lng, lat] = points.reduce(([x, y], point) => [x + point[0], y + point[1]], [0, 0]);
    return [lng / points.length, lat / points.length] as LngLat;
  };
  switch (geometry.type) {
    case 'Point':
      return [geometry.coordinates[0], geometry.coordinates[1]];
    case 'MultiPoint':
      return average(geometry.coordinates);
    case 'LineString': {
      const middle = geometry.coordinates[Math.floor(geometry.coordinates.length / 2)];
      return middle ? [middle[0], middle[1]] : null;
    }
    case 'MultiLineString':
      return featureAnchor({
        ...feature,
        geometry: { type: 'LineString', coordinates: geometry.coordinates[0] ?? [] },
      });
    case 'Polygon':
      return geometry.coordinates[0]?.length ? average(geometry.coordinates[0]) : null;
    case 'MultiPolygon':
      return geometry.coordinates[0]?.[0]?.length ? average(geometry.coordinates[0][0]) : null;
    default:
      return geometry.geometries.length
        ? featureAnchor({ ...feature, geometry: geometry.geometries[0] })
        : null;
  }
}
