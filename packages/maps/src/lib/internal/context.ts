import { getContext, setContext } from 'svelte';
import type { Map as MapLibreMap } from 'maplibre-gl';
import type { MapColors } from '@loidolt/theme-tokens';
import type { StyleSpecification } from '../core/types.js';
import type { MapLibreModule } from '../maplibre.js';

const MAP = Symbol('loidolt-map');
const SOURCE = Symbol('loidolt-map-source');

/** A layer as the map knows it — what `LayerManager` lists. */
export interface LayerEntry {
  id: string;
  label: string;
  type: string;
}

export interface MapContext {
  readonly map: MapLibreMap | null;
  readonly lib: MapLibreModule | null;
  /** The style has loaded, so sources and layers can be added. */
  readonly loaded: boolean;
  /** Goes up whenever a style (re)loads; everything on the map re-adds itself then. */
  readonly styleVersion: number;
  readonly colors: MapColors;
  /** Goes up whenever `colors` changes. */
  readonly colorVersion: number;
  readonly reducedMotion: boolean;
  /** Which basemap is showing: `default`, `blank`, or the id of one passed to the switcher. */
  readonly basemap: string;
  setBasemap(id: string, style?: string | StyleSpecification): void;
  readonly layers: LayerEntry[];
  registerLayer(entry: LayerEntry): () => void;
}

export interface SourceContext {
  readonly id: string;
  /** The source exists on the current style. */
  readonly ready: boolean;
}

export const setMapContext = (context: MapContext) => setContext(MAP, context);

/** The enclosing map, or `null` outside one. */
export const getMapContext = () => getContext<MapContext | undefined>(MAP) ?? null;

/** The enclosing map; throws with a clear message outside one. */
export function requireMapContext(component: string): MapContext {
  const context = getMapContext();
  if (!context) throw new Error(`${component} must be placed inside a <MapView>.`);
  return context;
}

export const setSourceContext = (context: SourceContext) => setContext(SOURCE, context);
export const getSourceContext = () => getContext<SourceContext | undefined>(SOURCE) ?? null;
