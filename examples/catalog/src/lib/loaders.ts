/*
 * Registers what the optional pieces of the chart, map and docs packages need, once, from the
 * root layout. MapLibre 6's web worker is a separate file its own code cannot point a bundler
 * at; `?worker&url` has Vite bundle it and hand back where it went.
 */
import { setDeckLoader, setMapLibreWorkerUrl } from '@loidolt/theme-maps';
import maplibreWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setMapLibreWorkerUrl(maplibreWorker);

// deck.gl is optional for @loidolt/theme-maps; only the DeckOverlay page loads it.
setDeckLoader(() => import('@deck.gl/mapbox'));
