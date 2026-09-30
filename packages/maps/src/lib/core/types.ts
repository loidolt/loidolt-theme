/*
 * Minimal GeoJSON and map types, kept structural so `/core` needs neither MapLibre nor
 * `@types/geojson` to type-check.
 */

/** `[longitude, latitude]`, in that order, as GeoJSON and MapLibre both use. */
export type LngLat = [number, number];

/** `[[west, south], [east, north]]`. */
export type LngLatBounds = [LngLat, LngLat];

export type Position = number[];

export type Geometry =
  | { type: 'Point'; coordinates: Position }
  | { type: 'MultiPoint'; coordinates: Position[] }
  | { type: 'LineString'; coordinates: Position[] }
  | { type: 'MultiLineString'; coordinates: Position[][] }
  | { type: 'Polygon'; coordinates: Position[][] }
  | { type: 'MultiPolygon'; coordinates: Position[][][] }
  | { type: 'GeometryCollection'; geometries: Geometry[] };

export interface Feature<P = Record<string, unknown>> {
  type: 'Feature';
  id?: string | number;
  geometry: Geometry | null;
  properties: P | null;
}

export interface FeatureCollection<P = Record<string, unknown>> {
  type: 'FeatureCollection';
  features: Array<Feature<P>>;
}

export type GeoJSON = Geometry | Feature | FeatureCollection;

/** A MapLibre style document. Structural: any valid style object fits. */
export interface StyleSpecification {
  version: 8;
  name?: string;
  metadata?: Record<string, unknown>;
  sources: Record<string, Record<string, unknown>>;
  layers: Array<Record<string, unknown> & { id: string; type: string }>;
  glyphs?: string;
  sprite?: string;
  [key: string]: unknown;
}

/** Where the map is looking. */
export interface MapViewState {
  center: LngLat;
  zoom: number;
  bearing: number;
  pitch: number;
  bounds: LngLatBounds;
}

/** A click on the map. */
export interface MapClickEvent {
  lngLat: LngLat;
  point: [number, number];
  /** Rendered features under the pointer, topmost first. */
  features: unknown[];
}

/** A click on, or pointer over, a feature of one layer. */
export interface LayerFeatureEvent {
  /** The topmost feature of the layer under the pointer. */
  feature: Feature & { layer?: { id: string }; source?: string; state?: Record<string, unknown> };
  /** Every feature of the layer under the pointer. */
  features: Feature[];
  lngLat: LngLat;
  point: [number, number];
}

/** One entry in a map legend. */
export interface LegendItem {
  label: string;
  color: string;
  /** How the key is drawn: a filled square, a line, or a dot. */
  shape?: 'fill' | 'line' | 'dot';
}

/** A continuous scale in a map legend: its colours from least to most, and the end labels. */
export interface LegendGradient {
  colors: string[];
  min: string;
  max: string;
}

/** A place the non-visual feature list offers. */
export interface MapFeatureItem {
  id: string | number;
  label: string;
  lngLat: LngLat;
  /** A second line, e.g. an address or a status. */
  description?: string;
}
