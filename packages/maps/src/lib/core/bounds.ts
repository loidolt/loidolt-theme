import type { GeoJSON, Geometry, LngLat, LngLatBounds, Position } from './types.js';

/** Whether a pair is a real longitude/latitude: finite, within ±180 and ±90. */
export function isLngLat(value: unknown): value is LngLat {
  return (
    Array.isArray(value) &&
    value.length >= 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1]) &&
    Math.abs(value[0] as number) <= 180 &&
    Math.abs(value[1] as number) <= 90
  );
}

function* positions(geometry: Geometry | null | undefined): Generator<Position> {
  if (!geometry) return;
  switch (geometry.type) {
    case 'Point':
      yield geometry.coordinates;
      break;
    case 'MultiPoint':
    case 'LineString':
      yield* geometry.coordinates;
      break;
    case 'MultiLineString':
    case 'Polygon':
      for (const ring of geometry.coordinates) yield* ring;
      break;
    case 'MultiPolygon':
      for (const polygon of geometry.coordinates) for (const ring of polygon) yield* ring;
      break;
    case 'GeometryCollection':
      for (const part of geometry.geometries) yield* positions(part);
      break;
  }
}

/** Every coordinate in any GeoJSON object. */
export function* coordinatesOf(data: GeoJSON): Generator<Position> {
  if (data.type === 'FeatureCollection') {
    for (const feature of data.features) yield* positions(feature.geometry);
  } else if (data.type === 'Feature') {
    yield* positions(data.geometry);
  } else {
    yield* positions(data);
  }
}

/**
 * The box around GeoJSON or a list of points, or `null` when there is nothing to box. Does
 * not handle data that crosses the antimeridian.
 */
export function boundsOf(data: GeoJSON | LngLat[]): LngLatBounds | null {
  let [west, south, east, north] = [Infinity, Infinity, -Infinity, -Infinity];
  const points = Array.isArray(data) ? data : coordinatesOf(data);
  for (const [lng, lat] of points) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat)) continue;
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  return Number.isFinite(west)
    ? [
        [west, south],
        [east, north],
      ]
    : null;
}

/** The middle of a box. */
export function boundsCenter([[west, south], [east, north]]: LngLatBounds): LngLat {
  return [(west + east) / 2, (south + north) / 2];
}

/** Grows a box by a fraction of its size on every side (`0.1` adds 10%). */
export function padBounds(
  [[west, south], [east, north]]: LngLatBounds,
  ratio: number
): LngLatBounds {
  const [dx, dy] = [(east - west) * ratio, (north - south) * ratio];
  return [
    [Math.max(-180, west - dx), Math.max(-90, south - dy)],
    [Math.min(180, east + dx), Math.min(90, north + dy)],
  ];
}

/** Whether a point lies in a box, edges included. */
export function boundsContain(
  [[west, south], [east, north]]: LngLatBounds,
  [lng, lat]: LngLat
): boolean {
  return lng >= west && lng <= east && lat >= south && lat <= north;
}

/** Whether two boxes overlap. */
export function boundsIntersect(a: LngLatBounds, b: LngLatBounds): boolean {
  return a[0][0] <= b[1][0] && a[1][0] >= b[0][0] && a[0][1] <= b[1][1] && a[1][1] >= b[0][1];
}
