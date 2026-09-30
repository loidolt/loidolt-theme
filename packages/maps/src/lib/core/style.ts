import { mapColors, type MapColors } from '@loidolt/theme-tokens';
import type { StyleSpecification } from './types.js';

/** OpenFreeMap's planet tiles: free, keyless, OpenMapTiles schema. */
export const OPENFREEMAP_TILES = 'https://tiles.openfreemap.org/planet';
/** OpenFreeMap's glyph server. It serves the Noto Sans family. */
export const OPENFREEMAP_GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';
/** Attribution OpenFreeMap requires. Keep it visible: the attribution control shows it. */
export const OPENFREEMAP_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">© OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

/** Every layer this generator makes starts with this, so it can be found and repainted. */
export const BASEMAP_PREFIX = 'ldt-base-';

const SOURCE = 'ldt-base';

type Layer = StyleSpecification['layers'][number];
type Paint = Record<string, unknown>;

/** Line width that grows with zoom: `[zoom, width]` stops, interpolated exponentially. */
const widths = (...stops: Array<[number, number]>) => [
  'interpolate',
  ['exponential', 1.4],
  ['zoom'],
  ...stops.flat(),
];

const MAJOR = ['motorway', 'trunk', 'primary'];
const MEDIUM = ['secondary', 'tertiary'];
const MINOR = ['minor', 'service', 'track'];

/**
 * The colour of every basemap layer, by layer id. The style is built from this, and a theme
 * change repaints from it without reloading the style — so data layers on top survive.
 */
export function basemapPaint(colors: MapColors = mapColors()): Record<string, Paint> {
  const id = (name: string) => `${BASEMAP_PREFIX}${name}`;
  const label = {
    'text-color': colors.label,
    'text-halo-color': colors.labelHalo,
    'text-halo-width': 1.4,
  };
  return {
    [id('land')]: { 'background-color': colors.land },
    [id('park')]: { 'fill-color': colors.park },
    [id('wood')]: { 'fill-color': colors.park, 'fill-opacity': 0.7 },
    [id('water')]: { 'fill-color': colors.water },
    [id('waterway')]: { 'line-color': colors.water, 'line-width': widths([8, 0.5], [16, 3]) },
    [id('building')]: { 'fill-color': colors.building, 'fill-opacity': 0.8 },
    [id('road-minor')]: { 'line-color': colors.road, 'line-width': widths([12, 0.5], [18, 10]) },
    [id('road-medium-casing')]: {
      'line-color': colors.building,
      'line-width': widths([8, 0.8], [18, 16]),
    },
    [id('road-medium')]: { 'line-color': colors.road, 'line-width': widths([8, 0.5], [18, 13]) },
    [id('road-major-casing')]: {
      'line-color': colors.building,
      'line-width': widths([5, 1], [18, 22]),
    },
    [id('road-major')]: {
      'line-color': colors.roadMajor,
      'line-width': widths([5, 0.6], [18, 18]),
    },
    [id('rail')]: {
      'line-color': colors.boundary,
      'line-width': 1,
      'line-dasharray': [3, 3],
      'line-opacity': 0.6,
    },
    [id('boundary-country')]: {
      'line-color': colors.boundary,
      'line-width': widths([2, 0.8], [10, 2]),
    },
    [id('boundary-state')]: {
      'line-color': colors.boundary,
      'line-width': 1,
      'line-dasharray': [4, 3],
      'line-opacity': 0.7,
    },
    [id('label-water')]: label,
    [id('label-road')]: label,
    [id('label-place-minor')]: label,
    [id('label-place-major')]: label,
    [id('label-country')]: label,
  };
}

export interface BasemapStyleOptions {
  colors?: MapColors;
  /** A TileJSON URL, or a tile URL template with `{z}/{x}/{y}`. OpenMapTiles schema. */
  tiles?: string;
  /** Glyph URL template. The labels need it. */
  glyphs?: string;
  attribution?: string;
  /** Place, road and water names. */
  labels?: boolean;
  /** Font stack for labels — names the glyph server knows. */
  font?: string[];
  boldFont?: string[];
}

/**
 * A quiet basemap in the loidolt palette, drawn from any OpenMapTiles-schema vector tiles —
 * OpenFreeMap's by default. Land, water, parks, buildings, roads, rail, boundaries and names;
 * nothing else, so the data drawn on top carries the colour.
 */
export function createBasemapStyle({
  colors = mapColors(),
  tiles = OPENFREEMAP_TILES,
  glyphs = OPENFREEMAP_GLYPHS,
  attribution = OPENFREEMAP_ATTRIBUTION,
  labels = true,
  font = ['Noto Sans Regular'],
  boldFont = ['Noto Sans Bold'],
}: BasemapStyleOptions = {}): StyleSpecification {
  const paint = basemapPaint(colors);
  const layer = (
    name: string,
    type: string,
    sourceLayer: string | null,
    extra: Record<string, unknown> = {}
  ): Layer => ({
    id: `${BASEMAP_PREFIX}${name}`,
    type,
    ...(sourceLayer ? { source: SOURCE, 'source-layer': sourceLayer } : {}),
    paint: paint[`${BASEMAP_PREFIX}${name}`],
    ...extra,
  });
  const road = (classes: string[]) => ['match', ['get', 'class'], classes, true, false];
  const lineLayout = { 'line-cap': 'round', 'line-join': 'round' };
  const text = (size: unknown, fontStack = font) => ({
    'text-font': fontStack,
    'text-size': size,
    'text-max-width': 8,
  });

  const layers: Layer[] = [
    layer('land', 'background', null),
    layer('park', 'fill', 'park'),
    layer('wood', 'fill', 'landcover', { filter: road(['wood', 'grass']) }),
    layer('water', 'fill', 'water'),
    layer('waterway', 'line', 'waterway', { minzoom: 8 }),
    layer('building', 'fill', 'building', { minzoom: 13 }),
    layer('road-minor', 'line', 'transportation', {
      minzoom: 12,
      filter: road(MINOR),
      layout: lineLayout,
    }),
    layer('road-medium-casing', 'line', 'transportation', {
      minzoom: 8,
      filter: road(MEDIUM),
      layout: lineLayout,
    }),
    layer('road-medium', 'line', 'transportation', {
      minzoom: 8,
      filter: road(MEDIUM),
      layout: lineLayout,
    }),
    layer('road-major-casing', 'line', 'transportation', {
      minzoom: 5,
      filter: road(MAJOR),
      layout: lineLayout,
    }),
    layer('road-major', 'line', 'transportation', {
      minzoom: 5,
      filter: road(MAJOR),
      layout: lineLayout,
    }),
    layer('rail', 'line', 'transportation', { minzoom: 10, filter: road(['rail', 'transit']) }),
    layer('boundary-country', 'line', 'boundary', {
      filter: ['all', ['==', ['get', 'admin_level'], 2], ['!=', ['get', 'maritime'], 1]],
    }),
    layer('boundary-state', 'line', 'boundary', {
      minzoom: 3,
      filter: ['all', ['==', ['get', 'admin_level'], 4], ['!=', ['get', 'maritime'], 1]],
    }),
  ];

  if (labels) {
    layers.push(
      layer('label-water', 'symbol', 'water_name', {
        layout: { 'text-field': ['get', 'name'], ...text(12, ['Noto Sans Italic']) },
      }),
      layer('label-road', 'symbol', 'transportation_name', {
        minzoom: 13,
        layout: {
          'text-field': ['get', 'name'],
          'symbol-placement': 'line',
          ...text(11),
        },
      }),
      layer('label-place-minor', 'symbol', 'place', {
        minzoom: 11,
        filter: road(['village', 'suburb', 'neighbourhood', 'quarter', 'hamlet']),
        layout: { 'text-field': ['get', 'name'], ...text(12) },
      }),
      layer('label-place-major', 'symbol', 'place', {
        minzoom: 4,
        filter: road(['city', 'town']),
        layout: {
          'text-field': ['get', 'name'],
          ...text(['interpolate', ['linear'], ['zoom'], 4, 11, 12, 18], boldFont),
        },
      }),
      layer('label-country', 'symbol', 'place', {
        maxzoom: 7,
        filter: road(['country']),
        layout: {
          'text-field': ['get', 'name'],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.1,
          ...text(12, boldFont),
        },
      })
    );
  }

  const source = /\{z\}/.test(tiles)
    ? { type: 'vector', tiles: [tiles], maxzoom: 14, attribution }
    : { type: 'vector', url: tiles, attribution };

  return {
    version: 8,
    name: 'Loidolt',
    metadata: { 'loidolt:basemap': 'default' },
    glyphs,
    sources: { [SOURCE]: source },
    layers,
  };
}

/**
 * A tile-free map: the land colour and nothing else. For data that stands on its own, for
 * places with no network, and for tests. `glyphs` is kept so symbol layers can still label.
 */
export function createBlankStyle({
  colors = mapColors(),
  glyphs = OPENFREEMAP_GLYPHS,
}: Pick<BasemapStyleOptions, 'colors' | 'glyphs'> = {}): StyleSpecification {
  return {
    version: 8,
    name: 'Loidolt plain',
    metadata: { 'loidolt:basemap': 'blank' },
    glyphs,
    sources: {},
    layers: [
      {
        id: `${BASEMAP_PREFIX}land`,
        type: 'background',
        paint: basemapPaint(colors)[`${BASEMAP_PREFIX}land`],
      },
    ],
  };
}

/** Whether a style was made here, and so can be repainted in place on a theme change. */
export const isLoidoltStyle = (style: unknown): style is StyleSpecification =>
  typeof style === 'object' &&
  style !== null &&
  typeof (style as StyleSpecification).metadata?.['loidolt:basemap'] === 'string';
