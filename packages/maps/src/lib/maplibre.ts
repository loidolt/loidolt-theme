/*
 * MapLibre is a peer dependency, but it is never imported at module scope: a map loads it from
 * an effect, so server rendering never evaluates it (it needs WebGL and `window`), and pages
 * without a map never download it.
 *
 * `setMapLibreLoader` replaces how it is loaded — to use a global build from a script tag, or a
 * stand-in under test.
 */
import type * as MapLibre from 'maplibre-gl';

export type MapLibreModule = typeof MapLibre;
export type MapLibreLoader = () => Promise<unknown> | unknown;

/** MapLibre 6 is named exports only; 5 bundles as a default export too. Accept either. */
const unwrap = (module: unknown): MapLibreModule | null => {
  const candidate = module as { Map?: unknown; default?: { Map?: unknown } } | null;
  if (typeof candidate?.Map === 'function') return candidate as unknown as MapLibreModule;
  if (typeof candidate?.default?.Map === 'function') {
    return candidate.default as unknown as MapLibreModule;
  }
  return null;
};

const defaultLoader: MapLibreLoader = () => import('maplibre-gl');

let registered: MapLibreLoader | null = null;
let cached: Promise<MapLibreModule | null> | null = null;
let workerUrl: string | null = null;

/** Replaces how MapLibre is loaded. `null` restores the default dynamic import. */
export function setMapLibreLoader(loader: MapLibreLoader | null): void {
  registered = loader;
  cached = null;
}

/**
 * Where MapLibre's web worker is served from. MapLibre 6 ships the worker as its own file and
 * finds it relative to itself at runtime, which bundlers cannot see — so a bundled app has to
 * emit the worker and say where it went. With Vite:
 *
 *   import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
 *   setMapLibreWorkerUrl(workerUrl);
 *
 * Without it, raster layers still draw but GeoJSON and vector tiles never do. MapLibre 5
 * inlines its worker and needs none of this.
 */
export function setMapLibreWorkerUrl(url: string | null): void {
  workerUrl = url;
  cached = null;
}

/** Loads MapLibre once. Resolves `null` rather than rejecting when it cannot. */
export function loadMapLibre(): Promise<MapLibreModule | null> {
  cached ??= Promise.resolve()
    .then(registered ?? defaultLoader)
    .then(unwrap)
    .then((maplibre) => {
      if (maplibre && workerUrl) maplibre.setWorkerUrl?.(workerUrl);
      return maplibre;
    })
    .catch(() => null);
  return cached;
}
