import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  EARTH_RADIUS,
  GOOGLE_MAX_WAYPOINTS,
  appleDirectionsUrl,
  convexHull,
  createLevelOfDetail,
  createSpatialHandler,
  createSpatialIndex,
  createSpatialWorker,
  distanceMatrix,
  googleDirectionsLegUrls,
  googleDirectionsUrl,
  haversine,
  measureRoute,
  optimizeRoute,
  outlineOf,
  pathLength,
  simplifyFeatures,
  simplifyGeometry,
  simplifyLine,
  splitIntoLegs,
  toleranceForZoom,
  twoOpt,
  type Feature,
  type FeatureCollection,
  type LngLat,
  type SpatialRequest,
} from '../../src/lib/core/index.js';

const portland: LngLat = [-122.6765, 45.5231];
const seattle: LngLat = [-122.3321, 47.6062];

describe('distances', () => {
  it('measures great-circle distance in metres', () => {
    expect(haversine(portland, seattle) / 1000).toBeCloseTo(233.1, 0);
    expect(haversine(portland, portland)).toBe(0);
    expect(haversine([0, 0], [180, 0])).toBeCloseTo(Math.PI * EARTH_RADIUS, 0);
    expect(haversine([Number.NaN, 0], [0, 0])).toBeNaN();
    expect(pathLength([portland, seattle, portland])).toBeCloseTo(
      2 * haversine(portland, seattle),
      6
    );
    expect(pathLength([portland])).toBe(0);
  });

  it('builds a symmetric matrix', () => {
    const matrix = distanceMatrix([portland, seattle, [0, 0]]);
    expect(matrix[0][0]).toBe(0);
    expect(matrix[0][1]).toBe(matrix[1][0]);
    expect(matrix[2][1]).toBeGreaterThan(1e7);
  });
});

describe('route order', () => {
  // Stops along a line, given out of order; the best route walks them in sequence.
  const line: LngLat[] = [
    [0.03, 0],
    [0.01, 0],
    [0.04, 0],
    [0.02, 0],
  ];

  it('orders stops by nearest neighbour, then improves with 2-opt', () => {
    const route = optimizeRoute([0, 0], line);
    expect(route.order).toEqual([1, 3, 0, 2]);
    expect(route.legs).toHaveLength(4);
    expect(route.total).toBeCloseTo(haversine([0, 0], [0.04, 0]), 3);
    expect(optimizeRoute([0, 0], line, { improve: false }).order).toEqual([1, 3, 0, 2]);
    expect(optimizeRoute([0, 0], [])).toEqual({ order: [], legs: [], total: 0 });
  });

  it('untangles a crossing that nearest neighbour leaves behind', () => {
    const stops: LngLat[] = [
      [1, 0],
      [0, 1],
      [1, 1],
      [0, 2],
    ];
    const tangled = [0, 1, 2, 3];
    const better = twoOpt([0, 0], stops, tangled);
    expect(measureRoute([0, 0], stops, better).total).toBeLessThan(
      measureRoute([0, 0], stops, tangled).total
    );
    expect(twoOpt([0, 0], stops.slice(0, 2), [0, 1])).toEqual([0, 1]);
  });

  it('keeps stops it cannot measure, in the order given', () => {
    const route = optimizeRoute(
      [0, 0],
      [
        [Number.NaN, 0],
        [0.01, 0],
        [Number.NaN, 1],
      ]
    );
    expect(route.order).toEqual([1, 0, 2]);
    expect(route.total).toBeCloseTo(haversine([0, 0], [0.01, 0]), 6);
  });
});

describe('directions links', () => {
  it('writes Google links, latitude first, waypoints between origin and destination', () => {
    expect(
      googleDirectionsUrl([portland, seattle], { origin: [-122.5, 45.4], travelMode: 'driving' })
    ).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=45.4,-122.5&destination=47.6062,-122.3321&waypoints=45.5231,-122.6765&travelmode=driving'
    );
    expect(googleDirectionsUrl(['  1 Main St, Portland  '])).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=1%20Main%20St%2C%20Portland'
    );
    expect(googleDirectionsUrl([' ', [Number.NaN, 0]])).toBe('');
  });

  it('writes Apple links', () => {
    expect(appleDirectionsUrl([portland, seattle], { origin: 'Home', travelMode: 'walking' })).toBe(
      'https://maps.apple.com/directions?source=Home&waypoint=45.5231,-122.6765&destination=47.6062,-122.3321&mode=walking'
    );
    expect(appleDirectionsUrl([seattle], { travelMode: 'bicycling' })).toBe(
      'https://maps.apple.com/directions?destination=47.6062,-122.3321&mode=driving'
    );
    expect(appleDirectionsUrl([])).toBe('');
  });

  it('splits a long route into legs that meet end to start', () => {
    expect(splitIntoLegs([1, 2, 3], 5)).toEqual([[1, 2, 3]]);
    expect(splitIntoLegs([], 5)).toEqual([]);
    expect(splitIntoLegs([1, 2, 3, 4, 5, 6, 7], 3)).toEqual([
      [1, 2, 3],
      [3, 4, 5],
      [5, 6, 7],
    ]);
    expect(() => splitIntoLegs([1, 2], 1)).toThrow(RangeError);
  });

  it('gives one Google link per leg, within the waypoint limit', () => {
    const stops = Array.from({ length: 15 }, (_, index) => [index / 100, 0] as LngLat);
    const fromHere = googleDirectionsLegUrls(stops);
    expect(fromHere).toHaveLength(2);
    expect(fromHere[0]).not.toContain('origin=');
    expect(fromHere[0].split('%7C')).toHaveLength(GOOGLE_MAX_WAYPOINTS);
    expect(fromHere[1]).toContain('origin=0,0.09');
    const withOrigin = googleDirectionsLegUrls(stops, { origin: 'Depot' });
    expect(withOrigin[0]).toContain('origin=Depot');
    expect(withOrigin.every((url) => url.split('%7C').length <= GOOGLE_MAX_WAYPOINTS)).toBe(true);
    expect(googleDirectionsLegUrls(stops.slice(0, 3))).toHaveLength(1);
    expect(googleDirectionsLegUrls([])).toEqual([]);
  });
});

const point = (id: number, lngLat: LngLat): Feature => ({
  type: 'Feature',
  id,
  geometry: { type: 'Point', coordinates: lngLat },
  properties: { code: `p${id}` },
});

describe('spatial index', () => {
  const points = [point(1, [0, 0]), point(2, [1, 1]), point(3, [5, 5]), point(4, [5.1, 5.1])];

  it('finds what is in a box and what is nearest', () => {
    const index = createSpatialIndex();
    index.load({
      type: 'FeatureCollection',
      features: [...points, { type: 'Feature', geometry: null, properties: null }],
    });
    expect(index.size).toBe(4);
    expect(
      index
        .search([
          [-1, -1],
          [2, 2],
        ])
        .map((feature) => feature.id)
    ).toEqual(expect.arrayContaining([1, 2]));
    expect(
      index.search(
        [
          [-1, -1],
          [10, 10],
        ],
        { limit: 2 }
      )
    ).toHaveLength(2);
    expect(index.nearest([5.05, 5.2], 2).map((feature) => feature.id)).toEqual([4, 3]);
    expect(index.nearest([100, 60]).map((feature) => feature.id)).toEqual([4]);
  });

  it('inserts, replaces, removes and clears', () => {
    const index = createSpatialIndex({ getId: (feature) => feature.properties!.code as string });
    index.load(points);
    index.insert(point(9, [50, 50]));
    index.insert({ ...point(1, [60, 60]) });
    expect(index.size).toBe(5);
    expect(
      index.search([
        [59, 59],
        [61, 61],
      ])
    ).toHaveLength(1);
    expect(
      index.search([
        [-0.5, -0.5],
        [0.5, 0.5],
      ])
    ).toHaveLength(0);
    index.insert({ type: 'Feature', geometry: null, properties: { code: 'x' } });
    expect(index.remove('p9')).toBe(true);
    expect(index.remove('missing')).toBe(false);
    index.clear();
    expect(index.size).toBe(0);
    expect(index.nearest([0, 0])).toEqual([]);
  });
});

describe('simplification', () => {
  // Flat with a little noise, then a sharp peak: the noise goes, the peak stays.
  const wiggle: LngLat[] = [
    [0, 0],
    [1, 0.01],
    [2, -0.01],
    [3, 0],
    [4, 2],
    [5, 0],
  ];

  it('drops vertices within tolerance and keeps the ends', () => {
    expect(simplifyLine(wiggle, 0.1)).toEqual([
      [0, 0],
      [3, 0],
      [4, 2],
      [5, 0],
    ]);
    expect(simplifyLine(wiggle, 0)).toEqual(wiggle);
    expect(simplifyLine(wiggle.slice(0, 2), 5)).toHaveLength(2);
    expect(
      simplifyLine(
        [
          [0, 0],
          [0, 0],
          [1, 1],
        ],
        0.5
      )
    ).toEqual([
      [0, 0],
      [1, 1],
    ]);
    expect(
      simplifyLine(
        [
          [0, 0],
          [5, 1],
          [2, 0],
        ],
        0.5
      )
    ).toHaveLength(3);
  });

  it('simplifies every geometry type without breaking polygons', () => {
    const ring: LngLat[] = [
      [0, 0],
      [1, 0.001],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ];
    const tiny: LngLat[] = [
      [0, 0],
      [0.001, 0],
      [0.001, 0.001],
      [0, 0],
    ];
    expect(simplifyGeometry({ type: 'Polygon', coordinates: [ring] }, 0.1)).toEqual({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
      ],
    });
    expect(simplifyGeometry({ type: 'Polygon', coordinates: [tiny] }, 1)).toEqual({
      type: 'Polygon',
      coordinates: [tiny],
    });
    expect(simplifyGeometry({ type: 'MultiPolygon', coordinates: [[ring]] }, 0.1)).toMatchObject({
      type: 'MultiPolygon',
    });
    expect(simplifyGeometry({ type: 'LineString', coordinates: wiggle }, 0.1)).toMatchObject({
      coordinates: { length: 4 },
    });
    expect(simplifyGeometry({ type: 'MultiLineString', coordinates: [wiggle] }, 0.1)).toMatchObject(
      {
        coordinates: [{ length: 4 }],
      }
    );
    expect(
      simplifyGeometry(
        { type: 'GeometryCollection', geometries: [{ type: 'LineString', coordinates: wiggle }] },
        0.1
      )
    ).toMatchObject({ geometries: [{ coordinates: { length: 4 } }] });
    const pointGeometry = { type: 'Point' as const, coordinates: [1, 2] };
    expect(simplifyGeometry(pointGeometry, 1)).toBe(pointGeometry);
    const collection = simplifyFeatures(
      {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            id: 'a',
            properties: { name: 'kept' },
            geometry: { type: 'LineString', coordinates: wiggle },
          },
          { type: 'Feature', properties: null, geometry: null },
        ],
      },
      0.1
    );
    expect(collection.features[0]).toMatchObject({ id: 'a', properties: { name: 'kept' } });
    expect(collection.features[1].geometry).toBeNull();
  });

  it('wraps points in a closed convex hull', () => {
    const hull = convexHull([
      [0, 0],
      [2, 0],
      [1, 1],
      [2, 2],
      [0, 2],
      [2, 2],
    ]);
    expect(hull).toEqual([
      [0, 0],
      [2, 0],
      [2, 2],
      [0, 2],
      [0, 0],
    ]);
    expect(
      convexHull([
        [0, 0],
        [1, 1],
      ])
    ).toEqual([
      [0, 0],
      [1, 1],
    ]);
  });
});

describe('level of detail', () => {
  const coast: FeatureCollection = {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: Array.from({ length: 200 }, (_, index) => [
            index / 100,
            Math.sin(index / 5) / 200,
          ]),
        },
      },
    ],
  };

  it('derives tolerance from zoom', () => {
    expect(toleranceForZoom(0)).toBeCloseTo(360 / 512, 10);
    expect(toleranceForZoom(1)).toBeCloseTo(toleranceForZoom(0) / 2, 10);
    expect(toleranceForZoom(3, { pixels: 2, tileSize: 256 })).toBeCloseTo(
      (360 / (256 * 8)) * 2,
      10
    );
  });

  it('draws less when zoomed out, caches per zoom, and leaves close zooms alone', () => {
    const detail = createLevelOfDetail(coast, { maxZoom: 14 });
    const far = detail.at(4.7);
    const vertices = (collection: FeatureCollection) =>
      (collection.features[0].geometry as { coordinates: unknown[] }).coordinates.length;
    expect(vertices(far)).toBeLessThan(20);
    expect(detail.at(4.2)).toBe(far);
    expect(vertices(detail.at(12))).toBeGreaterThan(vertices(far));
    expect(detail.at(15)).toBe(coast);
    detail.clear();
    expect(detail.at(4)).not.toBe(far);
  });

  it('outlines a group of features', () => {
    const outline = outlineOf([point(1, [0, 0]), point(2, [2, 0]), point(3, [1, 2])], {
      name: 'Group',
    });
    expect(outline).toMatchObject({ geometry: { type: 'Polygon' }, properties: { name: 'Group' } });
    expect(outlineOf([point(1, [0, 0])])).toBeNull();
  });
});

describe('spatial worker', () => {
  const collection: FeatureCollection = {
    type: 'FeatureCollection',
    features: [point(1, [0, 0]), point(2, [3, 3])],
  };

  afterEach(() => vi.useRealTimers());

  it('answers every request through the shared handler', () => {
    const handle = createSpatialHandler();
    expect(handle({ id: 1, type: 'load', features: collection, idProperty: 'code' })).toEqual({
      id: 1,
      ok: true,
      result: 2,
    });
    expect(
      handle({
        id: 2,
        type: 'search',
        bounds: [
          [-1, -1],
          [1, 1],
        ],
      })
    ).toMatchObject({ ok: true, result: [{ id: 1 }] });
    expect(handle({ id: 3, type: 'nearest', point: [2.9, 2.9] })).toMatchObject({
      result: [{ id: 2 }],
    });
    expect(handle({ id: 4, type: 'simplify', zoom: 3 })).toMatchObject({
      ok: true,
      result: { type: 'FeatureCollection' },
    });
    expect(handle({ id: 5, type: 'teleport' } as unknown as SpatialRequest)).toEqual({
      id: 5,
      ok: false,
      error: 'Unknown request "teleport"',
    });
    expect(handle({ id: 6, type: 'search', bounds: null as never })).toMatchObject({
      id: 6,
      ok: false,
    });
  });

  it('runs on the main thread where workers are unavailable', async () => {
    const worker = createSpatialWorker();
    expect(worker.mode).toBe('main-thread');
    expect(await worker.load(collection)).toBe(2);
    expect(
      (
        await worker.search([
          [-1, -1],
          [1, 1],
        ])
      ).map((feature) => feature.id)
    ).toEqual([1]);
    expect((await worker.nearest([3, 3], 1))[0].id).toBe(2);
    expect((await worker.simplify(2)).features).toHaveLength(2);
    await expect(worker.search(null as never)).rejects.toThrow();
    worker.terminate();
  });

  /** A worker that runs the handler, asynchronously, the way a real one answers. */
  class LoopbackWorker extends EventTarget {
    handle = createSpatialHandler();
    silent = false;
    terminated = false;
    postMessage(message: SpatialRequest) {
      if (this.silent) return;
      queueMicrotask(() =>
        this.dispatchEvent(Object.assign(new Event('message'), { data: this.handle(message) }))
      );
    }
    terminate() {
      this.terminated = true;
    }
  }

  it('talks to a worker when one starts', async () => {
    const loopback = new LoopbackWorker();
    const worker = createSpatialWorker({ workerFactory: () => loopback as unknown as Worker });
    expect(worker.mode).toBe('worker');
    expect(await worker.load(collection)).toBe(2);
    expect(
      (
        await worker.search([
          [2, 2],
          [4, 4],
        ])
      ).map((feature) => feature.id)
    ).toEqual([2]);
    await expect(worker.search(null as never)).rejects.toThrow();
    worker.terminate();
    expect(loopback.terminated).toBe(true);
    expect(worker.mode).toBe('main-thread');
  });

  it('gives up on a request that takes too long, and rejects what is pending on terminate', async () => {
    vi.useFakeTimers();
    const silent = Object.assign(new LoopbackWorker(), { silent: true });
    const worker = createSpatialWorker({
      workerFactory: () => silent as unknown as Worker,
      timeout: 100,
    });
    const slow = worker.search([
      [0, 0],
      [1, 1],
    ]);
    vi.advanceTimersByTime(101);
    await expect(slow).rejects.toThrow('took longer than 100 ms');
    const stranded = worker.nearest([0, 0]);
    worker.terminate();
    await expect(stranded).rejects.toThrow('terminated');
  });

  it('moves to the main thread, index intact, when the worker fails', async () => {
    const failing = Object.assign(new LoopbackWorker(), { silent: true });
    const worker = createSpatialWorker({ workerFactory: () => failing as unknown as Worker });
    const loading = worker.load(collection);
    const searching = worker.search([
      [-1, -1],
      [1, 1],
    ]);
    failing.dispatchEvent(new Event('error'));
    expect(await loading).toBe(2);
    expect((await searching).map((feature) => feature.id)).toEqual([1]);
    expect(worker.mode).toBe('main-thread');
    expect((await worker.nearest([3, 3]))[0].id).toBe(2);

    // A failure after the load has settled still replays it.
    const second = Object.assign(new LoopbackWorker(), { silent: false });
    const again = createSpatialWorker({ workerFactory: () => second as unknown as Worker });
    await again.load(collection);
    second.silent = true;
    const pending = again.search([
      [2, 2],
      [4, 4],
    ]);
    second.dispatchEvent(new Event('error'));
    expect((await pending).map((feature) => feature.id)).toEqual([2]);
  });

  it('falls back when the worker cannot even start', () => {
    const worker = createSpatialWorker({
      workerFactory: () => {
        throw new Error('blocked by CSP');
      },
    });
    expect(worker.mode).toBe('main-thread');
  });
});
