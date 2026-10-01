import type { LngLat } from './types.js';

/*
 * Straight-line routing: great-circle distances, a good visiting order for a set of stops, and
 * links that hand the order to Google or Apple Maps for turn-by-turn directions. No routing
 * service, no key — the order is by distance as the crow flies, which is what a day's stops
 * usually need before a driver looks at roads.
 */

/** Mean earth radius, in metres (IUGG). */
export const EARTH_RADIUS = 6_371_008.8;

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const finite = ([lng, lat]: LngLat) => Number.isFinite(lng) && Number.isFinite(lat);

/** Great-circle distance in metres. `NaN` when either point is not a real coordinate. */
export function haversine(a: LngLat, b: LngLat): number {
  if (!finite(a) || !finite(b)) return Number.NaN;
  const [dLat, dLng] = [radians(b[1] - a[1]), radians(b[0] - a[0])];
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** The length of a path through `points`, in metres. */
export const pathLength = (points: LngLat[]) =>
  points.slice(1).reduce((sum, point, index) => sum + haversine(points[index], point), 0);

/** Every pairwise distance, in metres. Symmetric, with zeros on the diagonal. */
export function distanceMatrix(points: LngLat[]): number[][] {
  const matrix = points.map(() => new Array<number>(points.length).fill(0));
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      matrix[i][j] = matrix[j][i] = haversine(points[i], points[j]);
    }
  }
  return matrix;
}

export interface RouteOrder {
  /** Indexes into the stops, in visiting order. */
  order: number[];
  /** Each leg's length in metres: origin to the first stop, then stop to stop. */
  legs: number[];
  /** The whole route, in metres. Legs that cannot be measured count as zero. */
  total: number;
}

function measure(
  origin: LngLat,
  points: LngLat[],
  order: number[],
  matrix: number[][]
): RouteOrder {
  const legs = order.map((stop, index) =>
    index === 0 ? haversine(origin, points[stop]) : matrix[order[index - 1]][stop]
  );
  return {
    order,
    legs,
    total: legs.reduce((sum, leg) => sum + (Number.isFinite(leg) ? leg : 0), 0),
  };
}

function greedy(origin: LngLat, points: LngLat[], matrix: number[][]): number[] {
  const visited = new Array<boolean>(points.length).fill(false);
  const order: number[] = [];
  while (order.length < points.length) {
    let best = -1;
    let bestDistance = Infinity;
    for (let index = 0; index < points.length; index++) {
      if (visited[index]) continue;
      const distance = order.length
        ? matrix[order.at(-1)!][index]
        : haversine(origin, points[index]);
      // Strictly less: a tie keeps the earlier stop, so the order is stable.
      if (Number.isFinite(distance) && distance < bestDistance)
        [best, bestDistance] = [index, distance];
    }
    if (best === -1) {
      // Whatever is left cannot be measured; keep it, in the order given.
      for (let index = 0; index < points.length; index++) if (!visited[index]) order.push(index);
      break;
    }
    visited[best] = true;
    order.push(best);
  }
  return order;
}

/**
 * Improves an order by reversing any stretch that shortens the route, until none does (2-opt).
 * The route starts at `origin` and ends at its last stop; it does not return.
 */
export function twoOpt(
  origin: LngLat,
  points: LngLat[],
  order: number[],
  {
    maxPasses = 20,
    matrix = distanceMatrix(points),
  }: { maxPasses?: number; matrix?: number[][] } = {}
): number[] {
  const best = [...order];
  if (best.length < 3) return best;
  const fromOrigin = points.map((point) => haversine(origin, point));
  const last = best.length - 1;
  for (let pass = 0; pass < maxPasses; pass++) {
    let improved = false;
    for (let i = 0; i < last; i++) {
      for (let j = i + 1; j <= last; j++) {
        const before = i === 0 ? fromOrigin[best[0]] : matrix[best[i - 1]][best[i]];
        const after = i === 0 ? fromOrigin[best[j]] : matrix[best[i - 1]][best[j]];
        // A stretch running to the end has no edge after it: the route just stops there.
        const tailBefore = j === last ? 0 : matrix[best[j]][best[j + 1]];
        const tailAfter = j === last ? 0 : matrix[best[i]][best[j + 1]];
        if (after + tailAfter - before - tailBefore < -1e-6) {
          best.splice(i, j - i + 1, ...best.slice(i, j + 1).reverse());
          improved = true;
        }
      }
    }
    if (!improved) break;
  }
  return best;
}

/**
 * A short order to visit `stops` from `origin`: nearest neighbour first, then 2-opt. Not the
 * shortest possible — that problem is intractable — but close for a day's worth of stops.
 */
export function optimizeRoute(
  origin: LngLat,
  stops: LngLat[],
  { improve = true, maxPasses }: { improve?: boolean; maxPasses?: number } = {}
): RouteOrder {
  if (!stops.length) return { order: [], legs: [], total: 0 };
  const matrix = distanceMatrix(stops);
  const first = greedy(origin, stops, matrix);
  const order = improve ? twoOpt(origin, stops, first, { maxPasses, matrix }) : first;
  return measure(origin, stops, order, matrix);
}

/** Legs and total for an order you already have, to compare against an optimised one. */
export const measureRoute = (origin: LngLat, stops: LngLat[], order: number[]): RouteOrder =>
  measure(origin, stops, order, distanceMatrix(stops));

/** A stop for a directions link: a coordinate, or an address to search for. */
export type RouteStop = LngLat | string;

const encodeStop = (stop: RouteStop): string | null => {
  if (typeof stop === 'string') return stop.trim() ? encodeURIComponent(stop.trim()) : null;
  return finite(stop) ? `${stop[1]},${stop[0]}` : null;
};

/** Google Maps allows this many stops between origin and destination in one link. */
export const GOOGLE_MAX_WAYPOINTS = 9;

export interface DirectionsOptions {
  /** Where the trip starts. Leave it out to start from the user's location. */
  origin?: RouteStop;
  travelMode?: 'driving' | 'walking' | 'bicycling' | 'transit';
}

/** A Google Maps directions link through `stops`, the last being the destination. */
export function googleDirectionsUrl(
  stops: RouteStop[],
  { origin, travelMode }: DirectionsOptions = {}
): string {
  const encoded = stops.map(encodeStop).filter((stop): stop is string => stop !== null);
  if (!encoded.length) return '';
  const start = origin === undefined ? null : encodeStop(origin);
  const params = [
    'api=1',
    ...(start ? [`origin=${start}`] : []),
    `destination=${encoded.at(-1)}`,
    ...(encoded.length > 1 ? [`waypoints=${encoded.slice(0, -1).join('%7C')}`] : []),
    ...(travelMode ? [`travelmode=${travelMode}`] : []),
  ];
  return `https://www.google.com/maps/dir/?${params.join('&')}`;
}

/** An Apple Maps directions link through `stops`. */
export function appleDirectionsUrl(
  stops: RouteStop[],
  { origin, travelMode }: DirectionsOptions = {}
): string {
  const encoded = stops.map(encodeStop).filter((stop): stop is string => stop !== null);
  if (!encoded.length) return '';
  const start = origin === undefined ? null : encodeStop(origin);
  // Apple has no cycling mode in links; it falls back to driving, as it does itself.
  const mode = travelMode === 'walking' || travelMode === 'transit' ? travelMode : 'driving';
  const params = [
    ...(start ? [`source=${start}`] : []),
    ...encoded.slice(0, -1).map((stop) => `waypoint=${stop}`),
    `destination=${encoded.at(-1)}`,
    `mode=${mode}`,
  ];
  return `https://maps.apple.com/directions?${params.join('&')}`;
}

/**
 * Splits a long list of stops into legs that each fit one link, every leg starting where the
 * last one ended.
 */
export function splitIntoLegs<T>(stops: T[], maxPerLeg = GOOGLE_MAX_WAYPOINTS + 2): T[][] {
  if (maxPerLeg < 2) throw new RangeError('splitIntoLegs: a leg needs at least 2 stops');
  if (stops.length <= maxPerLeg) return stops.length ? [[...stops]] : [];
  const legs: T[][] = [];
  for (let start = 0; start < stops.length - 1; start += maxPerLeg - 1) {
    legs.push(stops.slice(start, start + maxPerLeg));
  }
  return legs;
}

/**
 * Google Maps links for a route too long for one: one per leg, each starting where the last one
 * ended. A leg holds an origin, up to nine waypoints and a destination.
 */
export function googleDirectionsLegUrls(
  stops: RouteStop[],
  options: DirectionsOptions = {}
): string[] {
  const usable = stops.filter((stop) => encodeStop(stop) !== null);
  if (!usable.length) return [];
  const { origin, travelMode } = options;
  // With no origin the first link starts wherever the user is, so it has room for one more stop.
  const first = origin === undefined ? usable.slice(0, GOOGLE_MAX_WAYPOINTS + 1) : [];
  const remaining = origin === undefined ? usable.slice(first.length - 1) : [origin, ...usable];
  const legs = remaining.length > 1 ? splitIntoLegs(remaining) : [];
  return [
    ...(first.length ? [googleDirectionsUrl(first, { travelMode })] : []),
    ...legs.map(([start, ...rest]) => googleDirectionsUrl(rest, { origin: start, travelMode })),
  ];
}
