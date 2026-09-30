import { describe, expect, it, vi } from 'vitest';
import { darkSemantic, mapColors, semantic } from '@loidolt/theme-tokens';
import {
  BASEMAP_PREFIX,
  MAP_KEYS,
  OPENFREEMAP_ATTRIBUTION,
  basemapPaint,
  boundsCenter,
  boundsContain,
  boundsIntersect,
  boundsOf,
  changedProperties,
  clusterColor,
  clusterRadius,
  coordinatesOf,
  createBasemapStyle,
  createBlankStyle,
  deepEqual,
  describeMapKeys,
  describeZoom,
  expandCluster,
  featureAnchor,
  formatArea,
  formatCoordinate,
  formatDistance,
  formatMoveAnnouncement,
  isCluster,
  isLngLat,
  isLoidoltStyle,
  loadGeoJSON,
  padBounds,
  pointsToFeatureCollection,
  validateGeoJSON,
  type Feature,
  type FeatureCollection,
} from '../../src/lib/core/index.js';

const square: Feature = {
  type: 'Feature',
  geometry: {
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
  },
  properties: {},
};

describe('bounds', () => {
  it('recognises real coordinates', () => {
    expect(isLngLat([-122, 45])).toBe(true);
    expect(isLngLat([45, -122])).toBe(false);
    expect(isLngLat([Number.NaN, 0])).toBe(false);
    expect(isLngLat('0,0')).toBe(false);
  });

  it('walks every geometry type', () => {
    const collection: FeatureCollection = {
      type: 'FeatureCollection',
      features: [
        square,
        { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 5] }, properties: null },
        {
          type: 'Feature',
          geometry: { type: 'MultiPoint', coordinates: [[6, 6]] },
          properties: null,
        },
        {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: [[7, 7]] },
          properties: null,
        },
        {
          type: 'Feature',
          geometry: { type: 'MultiLineString', coordinates: [[[8, 8]]] },
          properties: null,
        },
        {
          type: 'Feature',
          geometry: { type: 'MultiPolygon', coordinates: [[[[9, 9]]]] },
          properties: null,
        },
        {
          type: 'Feature',
          geometry: {
            type: 'GeometryCollection',
            geometries: [{ type: 'Point', coordinates: [-1, -1] }],
          },
          properties: null,
        },
        { type: 'Feature', geometry: null, properties: null },
      ],
    };
    expect([...coordinatesOf(collection)]).toHaveLength(11);
    expect(boundsOf(collection)).toEqual([
      [-1, -1],
      [9, 9],
    ]);
    expect(boundsOf(square)).toEqual([
      [0, 0],
      [2, 2],
    ]);
    expect(boundsOf({ type: 'Point', coordinates: [3, 4] })).toEqual([
      [3, 4],
      [3, 4],
    ]);
    expect(
      boundsOf([
        [1, 1],
        [Number.NaN, 2],
        [3, 0],
      ])
    ).toEqual([
      [1, 0],
      [3, 1],
    ]);
    expect(boundsOf([])).toBeNull();
  });

  it('centres, pads, contains and intersects', () => {
    const box: [[number, number], [number, number]] = [
      [0, 0],
      [10, 4],
    ];
    expect(boundsCenter(box)).toEqual([5, 2]);
    expect(padBounds(box, 0.1)).toEqual([
      [-1, -0.4],
      [11, 4.4],
    ]);
    expect(
      padBounds(
        [
          [-180, -90],
          [180, 90],
        ],
        1
      )
    ).toEqual([
      [-180, -90],
      [180, 90],
    ]);
    expect(boundsContain(box, [10, 4])).toBe(true);
    expect(boundsContain(box, [11, 4])).toBe(false);
    expect(
      boundsIntersect(box, [
        [9, 3],
        [12, 8],
      ])
    ).toBe(true);
    expect(
      boundsIntersect(box, [
        [11, 3],
        [12, 8],
      ])
    ).toBe(false);
  });
});

describe('formatting', () => {
  it('writes coordinates latitude first, with hemispheres', () => {
    expect(formatCoordinate([-122.676, 45.523])).toBe('45.52300° N, 122.67600° W');
    expect(formatCoordinate([151.2, -33.87], { precision: 1 })).toBe('33.9° S, 151.2° E');
    expect(formatCoordinate([-122.676, 45.523], { format: 'dms' })).toBe(
      '45° 31′ 22.8″ N, 122° 40′ 33.6″ W'
    );
    // Seconds that round up to 60 carry into the minute, and minutes into the degree.
    expect(formatCoordinate([0, 10.99999], { format: 'dms', precision: 0 })).toBe(
      '11° 0′ 0″ N, 0° 0′ 0″ E'
    );
  });

  it('writes distances and areas in either unit system', () => {
    expect(formatDistance(850, { locale: 'en-US' })).toBe('850 m');
    expect(formatDistance(12400, { locale: 'en-US' })).toBe('12 km');
    expect(formatDistance(2400, { locale: 'en-US' })).toBe('2.4 km');
    expect(formatDistance(100, { unit: 'imperial', locale: 'en-US' })).toBe('328 ft');
    expect(formatDistance(5000, { unit: 'imperial', locale: 'en-US' })).toBe('3.1 mi');
    expect(formatDistance(50000, { unit: 'imperial', locale: 'en-US' })).toBe('31 mi');
    expect(formatArea(5000, { locale: 'en-US' })).toBe('5,000 m²');
    expect(formatArea(2.5e6, { locale: 'en-US' })).toBe('2.5 km²');
    expect(formatArea(20000, { unit: 'imperial', locale: 'en-US' })).toBe('4.94 ac');
    expect(formatArea(200000, { unit: 'imperial', locale: 'en-US' })).toBe('49.4 ac');
    expect(formatArea(5e6, { unit: 'imperial', locale: 'en-US' })).toBe('1.9 mi²');
  });
});

describe('basemap styles', () => {
  it('draws OpenMapTiles data from OpenFreeMap in the loidolt palette', () => {
    const style = createBasemapStyle();
    expect(style.version).toBe(8);
    expect(style.sources['ldt-base']).toEqual({
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
      attribution: OPENFREEMAP_ATTRIBUTION,
    });
    expect(style.glyphs).toContain('tiles.openfreemap.org/fonts');
    expect(style.layers.every((layer) => layer.id.startsWith(BASEMAP_PREFIX))).toBe(true);
    const land = style.layers.find((layer) => layer.id === 'ldt-base-land')!;
    expect(land.paint).toEqual({ 'background-color': semantic.mapLand });
    expect(style.layers.find((layer) => layer.id === 'ldt-base-water')?.['source-layer']).toBe(
      'water'
    );
    expect(style.layers.some((layer) => layer.type === 'symbol')).toBe(true);
    expect(isLoidoltStyle(style)).toBe(true);
  });

  it('takes other tiles, fonts and colours, and can drop labels', () => {
    const style = createBasemapStyle({
      colors: mapColors('dark'),
      tiles: 'https://tiles.example/{z}/{x}/{y}.pbf',
      labels: false,
    });
    expect(style.sources['ldt-base']).toMatchObject({
      tiles: ['https://tiles.example/{z}/{x}/{y}.pbf'],
    });
    expect(style.layers.some((layer) => layer.type === 'symbol')).toBe(false);
    expect(style.layers[0].paint).toEqual({ 'background-color': darkSemantic.mapLand });
  });

  it('repaints from one table of colours', () => {
    const paint = basemapPaint(mapColors('dark'));
    expect(paint['ldt-base-water']).toEqual({ 'fill-color': darkSemantic.mapWater });
    expect(paint['ldt-base-label-road']).toMatchObject({ 'text-color': darkSemantic.mapLabel });
    for (const layer of createBasemapStyle().layers) expect(paint[layer.id]).toBeDefined();
  });

  it('makes a tile-free style', () => {
    const style = createBlankStyle();
    expect(style.sources).toEqual({});
    expect(style.layers).toHaveLength(1);
    expect(isLoidoltStyle(style)).toBe(true);
    expect(isLoidoltStyle({ version: 8 })).toBe(false);
    expect(isLoidoltStyle('https://example/style.json')).toBe(false);
  });
});

describe('GeoJSON', () => {
  it('accepts valid data of every shape', () => {
    expect(validateGeoJSON(square)).toEqual({ valid: true, errors: [] });
    expect(validateGeoJSON({ type: 'FeatureCollection', features: [square] }).valid).toBe(true);
    expect(validateGeoJSON({ type: 'Point', coordinates: [1, 2] }).valid).toBe(true);
    expect(
      validateGeoJSON({
        type: 'GeometryCollection',
        geometries: [{ type: 'Point', coordinates: [1, 2] }],
      }).valid
    ).toBe(true);
    expect(validateGeoJSON({ type: 'Feature', geometry: null, properties: null }).valid).toBe(true);
  });

  it('names what is wrong, and where', () => {
    expect(validateGeoJSON(null).errors).toEqual(['not an object']);
    expect(validateGeoJSON({ type: 'FeatureCollection' }).errors).toEqual([
      'features: must be an array',
    ]);
    expect(validateGeoJSON({ type: 'FeatureCollection', features: [{}] }).errors).toEqual([
      'features[0]: not a Feature',
    ]);
    // The classic mistake: [lat, lng].
    expect(validateGeoJSON({ type: 'Point', coordinates: [45, -122] }).errors).toEqual([
      'geometry.coordinates: not a [longitude, latitude] position',
    ]);
    expect(validateGeoJSON({ type: 'LineString', coordinates: 'x' }).errors).toEqual([
      'geometry.coordinates: must be an array',
    ]);
    expect(validateGeoJSON({ type: 'Circle' }).errors).toEqual([
      'geometry: not a GeoJSON geometry',
    ]);
    expect(validateGeoJSON({ type: 'GeometryCollection' }).errors).toEqual([
      'geometry.geometries: must be an array',
    ]);
  });

  it('loads and validates remote data', async () => {
    const ok = vi.fn(async () => new Response(JSON.stringify(square)));
    await expect(loadGeoJSON('/a.json', { fetch: ok as typeof fetch })).resolves.toEqual(square);

    const missing = vi.fn(async () => new Response('nope', { status: 404 }));
    await expect(loadGeoJSON('/b.json', { fetch: missing as typeof fetch })).rejects.toThrow(
      'loadGeoJSON: /b.json answered 404'
    );

    const invalid = vi.fn(async () => new Response('{"type":"Nope"}'));
    await expect(loadGeoJSON('/c.json', { fetch: invalid as typeof fetch })).rejects.toThrow(
      /is not valid GeoJSON/
    );

    const slow = vi.fn(
      (_url: string, init: RequestInit) =>
        new Promise<Response>((_resolve, reject) =>
          init.signal!.addEventListener('abort', () => reject(new DOMException('aborted')))
        )
    );
    await expect(loadGeoJSON('/d.json', { fetch: slow as never, timeout: 5 })).rejects.toThrow(
      'took longer than 5 ms'
    );

    const controller = new AbortController();
    const pending = loadGeoJSON('/e.json', { fetch: slow as never, signal: controller.signal });
    controller.abort();
    await expect(pending).rejects.toThrow('aborted');
  });

  it('builds collections from points and finds anchors', () => {
    const collection = pointsToFeatureCollection([
      { lngLat: [1, 2], id: 'a', properties: { name: 'A' } },
      { lngLat: [3, 4] },
    ]);
    expect(collection.features[0]).toEqual({
      type: 'Feature',
      id: 'a',
      geometry: { type: 'Point', coordinates: [1, 2] },
      properties: { name: 'A' },
    });
    expect(collection.features[1]).not.toHaveProperty('id');

    const anchor = (geometry: Feature['geometry']) =>
      featureAnchor({ type: 'Feature', geometry, properties: null });
    expect(featureAnchor(square)).toEqual([1, 1]);
    expect(anchor({ type: 'Point', coordinates: [1, 2] })).toEqual([1, 2]);
    expect(
      anchor({
        type: 'MultiPoint',
        coordinates: [
          [0, 0],
          [2, 2],
        ],
      })
    ).toEqual([1, 1]);
    expect(
      anchor({
        type: 'LineString',
        coordinates: [
          [0, 0],
          [5, 5],
          [9, 9],
        ],
      })
    ).toEqual([5, 5]);
    expect(anchor({ type: 'LineString', coordinates: [] })).toBeNull();
    expect(
      anchor({
        type: 'MultiLineString',
        coordinates: [
          [
            [0, 0],
            [4, 4],
          ],
        ],
      })
    ).toEqual([4, 4]);
    expect(anchor({ type: 'Polygon', coordinates: [] })).toBeNull();
    expect(
      anchor({
        type: 'MultiPolygon',
        coordinates: [
          [
            [
              [0, 0],
              [2, 0],
              [2, 2],
            ],
          ],
        ],
      })
    ).toEqual([4 / 3, 2 / 3]);
    expect(anchor({ type: 'MultiPolygon', coordinates: [] })).toBeNull();
    expect(
      anchor({ type: 'GeometryCollection', geometries: [{ type: 'Point', coordinates: [7, 8] }] })
    ).toEqual([7, 8]);
    expect(anchor({ type: 'GeometryCollection', geometries: [] })).toBeNull();
    expect(anchor(null)).toBeNull();
  });
});

describe('property diffing', () => {
  it('compares style values structurally', () => {
    expect(deepEqual(['get', 'a'], ['get', 'a'])).toBe(true);
    expect(deepEqual(['get', 'a'], ['get', 'b'])).toBe(false);
    expect(deepEqual({ a: [1, { b: 2 }] }, { a: [1, { b: 2 }] })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1, c: 3 }, { a: 1, b: 3 })).toBe(false);
    expect(deepEqual([1], { 0: 1 })).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true);
  });

  it('lists only what changed, with removals as undefined', () => {
    expect(
      changedProperties(
        { 'fill-color': '#fff', 'fill-opacity': 0.5, 'fill-outline-color': '#000' },
        { 'fill-color': '#000', 'fill-opacity': 0.5 }
      )
    ).toEqual([
      ['fill-color', '#000'],
      ['fill-outline-color', undefined],
    ]);
    expect(changedProperties(undefined, { a: 1 })).toEqual([['a', 1]]);
    expect(changedProperties({ a: 1 }, undefined)).toEqual([['a', undefined]]);
  });
});

describe('clusters', () => {
  it('colours and sizes clusters by count on the sequential ramp', () => {
    const colors = mapColors();
    expect(clusterColor(colors)).toEqual([
      'step',
      ['get', 'point_count'],
      colors.sequential[1],
      10,
      colors.sequential[2],
      50,
      colors.sequential[3],
      200,
      colors.sequential[4],
    ]);
    expect(clusterColor(undefined, [5])).toHaveLength(5);
    expect(clusterRadius()).toEqual(['step', ['get', 'point_count'], 14, 10, 18, 50, 24, 200, 30]);
    expect(clusterRadius([1, 2, 3, 4, 5], [10])).toContain(10);
  });

  it('zooms into a clicked cluster, and ignores anything else', async () => {
    const easeTo = vi.fn();
    const map = {
      getSource: () => ({ getClusterExpansionZoom: async () => 11 }),
      easeTo,
    };
    const cluster = {
      properties: { cluster: true, cluster_id: 7 },
      geometry: { type: 'Point', coordinates: [1, 2] },
    };
    expect(isCluster(cluster)).toBe(true);
    expect(await expandCluster(map, 'stops', cluster)).toBe(true);
    expect(easeTo).toHaveBeenLastCalledWith({ center: [1, 2], zoom: 11, duration: undefined });
    await expandCluster(map, 'stops', cluster, { animate: false });
    expect(easeTo).toHaveBeenLastCalledWith({ center: [1, 2], zoom: 11, duration: 0 });

    expect(await expandCluster(map, 'stops', { properties: { name: 'point' } })).toBe(false);
    expect(await expandCluster({ getSource: () => ({}), easeTo }, 'stops', cluster)).toBe(false);
    expect(
      await expandCluster(map, 'stops', { ...cluster, geometry: { type: 'LineString' } })
    ).toBe(false);
  });
});

describe('accessibility text', () => {
  it('describes keys, zoom and moves', () => {
    expect(MAP_KEYS.map((key) => key.action)).toContain('Zoom in');
    expect(describeMapKeys()).toMatch(/arrow keys pan/);
    expect([1, 4, 7, 10, 13, 17].map(describeZoom)).toEqual([
      'world',
      'continent',
      'region',
      'city',
      'neighbourhood',
      'street',
    ]);
    expect(formatMoveAnnouncement([-122.68, 45.52], 11)).toBe(
      'Map centred on 45.52° N, 122.68° W at city level.'
    );
  });
});
