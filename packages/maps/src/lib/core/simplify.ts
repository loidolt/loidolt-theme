import type { Feature, FeatureCollection, Geometry, LngLat, Position } from './types.js';

/*
 * Fewer vertices for the same shape: Douglas-Peucker line simplification and convex hulls.
 * Tolerances are in degrees — see `toleranceForZoom` in `lod.ts` to derive one from a zoom.
 */

const squaredSegmentDistance = (point: Position, a: Position, b: Position) => {
  let [x, y] = a;
  let [dx, dy] = [b[0] - x, b[1] - y];
  if (dx !== 0 || dy !== 0) {
    const t = ((point[0] - x) * dx + (point[1] - y) * dy) / (dx * dx + dy * dy);
    if (t > 1) [x, y] = b;
    else if (t > 0) [x, y] = [x + dx * t, y + dy * t];
  }
  [dx, dy] = [point[0] - x, point[1] - y];
  return dx * dx + dy * dy;
};

/** A line with every vertex within `tolerance` of it dropped. Keeps both ends. */
export function simplifyLine<T extends Position>(points: T[], tolerance: number): T[] {
  if (points.length <= 2 || tolerance <= 0) return [...points];
  const limit = tolerance * tolerance;
  const keep = new Uint8Array(points.length);
  keep[0] = keep[points.length - 1] = 1;
  const stack: Array<[number, number]> = [[0, points.length - 1]];
  while (stack.length) {
    const [first, last] = stack.pop()!;
    let [furthest, max] = [-1, limit];
    for (let index = first + 1; index < last; index++) {
      const distance = squaredSegmentDistance(points[index], points[first], points[last]);
      if (distance > max) [furthest, max] = [index, distance];
    }
    if (furthest !== -1) {
      keep[furthest] = 1;
      stack.push([first, furthest], [furthest, last]);
    }
  }
  return points.filter((_, index) => keep[index]);
}

/** A polygon ring, simplified but never below a valid ring's four positions. */
function simplifyRing(ring: Position[], tolerance: number): Position[] {
  const simplified = simplifyLine(ring, tolerance);
  return simplified.length >= 4 ? simplified : ring;
}

/** A geometry with its lines and rings simplified; points are left alone. */
export function simplifyGeometry(geometry: Geometry, tolerance: number): Geometry {
  switch (geometry.type) {
    case 'LineString':
      return { ...geometry, coordinates: simplifyLine(geometry.coordinates, tolerance) };
    case 'MultiLineString':
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((line) => simplifyLine(line, tolerance)),
      };
    case 'Polygon':
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((ring) => simplifyRing(ring, tolerance)),
      };
    case 'MultiPolygon':
      return {
        ...geometry,
        coordinates: geometry.coordinates.map((polygon) =>
          polygon.map((ring) => simplifyRing(ring, tolerance))
        ),
      };
    case 'GeometryCollection':
      return {
        ...geometry,
        geometries: geometry.geometries.map((part) => simplifyGeometry(part, tolerance)),
      };
    default:
      return geometry;
  }
}

/** Every feature simplified; ids and properties are kept. */
export function simplifyFeatures<P>(
  collection: FeatureCollection<P>,
  tolerance: number
): FeatureCollection<P> {
  return {
    ...collection,
    features: collection.features.map((feature: Feature<P>) =>
      feature.geometry
        ? { ...feature, geometry: simplifyGeometry(feature.geometry, tolerance) }
        : feature
    ),
  };
}

/** The smallest convex polygon holding every point, counter-clockwise and closed. */
export function convexHull(points: LngLat[]): LngLat[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const unique = sorted.filter(
    (point, index) =>
      index === 0 || point[0] !== sorted[index - 1][0] || point[1] !== sorted[index - 1][1]
  );
  if (unique.length < 3) return unique;
  const cross = (o: LngLat, a: LngLat, b: LngLat) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (list: LngLat[]) => {
    const hull: LngLat[] = [];
    for (const point of list) {
      while (hull.length >= 2 && cross(hull[hull.length - 2], hull[hull.length - 1], point) <= 0)
        hull.pop();
      hull.push(point);
    }
    return hull.slice(0, -1);
  };
  const hull = [...half(unique), ...half([...unique].reverse())];
  return [...hull, hull[0]];
}
