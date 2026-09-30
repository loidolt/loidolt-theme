# @loidolt/theme-maps

Accessible, themed [MapLibre](https://maplibre.org) maps for Svelte 5, painted from the Loidolt
tokens.

- **A basemap in the loidolt palette.** Land, water, parks, buildings, roads and names drawn from
  any OpenMapTiles-schema vector tiles — [OpenFreeMap](https://openfreemap.org)'s free, keyless
  tiles by default — in the `--loidolt-map-*` colours. A theme switch repaints it in place, and
  data layers follow with it. `basemap="blank"` draws land only, with no network at all.
- **Keyboard and screen reader first.** The canvas is named and described (including how to move
  it); arrow keys pan and + and − zoom; where a keyboard move lands is announced. Markers are real
  buttons with names; popups take focus and give it back; `MapFeatureList` lists every place as a
  list you can tab through.
- **Server-rendered safely.** MapLibre loads in the browser only. Without WebGL the map says so
  instead of leaving a blank box.
- **Only what changed.** Layers diff their paint, layout and filters and send MapLibre only the
  difference; GeoJSON updates replace data in place.

## Install

```sh
npm install @loidolt/theme-maps maplibre-gl
```

`maplibre-gl` (5 or 6) is a peer dependency. Import the map stylesheet once, next to the theme's:

```css
@import '@loidolt/theme-svelte/styles.css';
@import '@loidolt/theme-maps/styles.css';
```

**MapLibre 6 and bundlers.** MapLibre 6 ships its web worker as a separate file and finds it at
runtime in a way bundlers cannot follow. Without it, raster layers draw but GeoJSON and vector
tiles never do. With Vite, have it bundle the worker and say where it went, once at start-up:

```ts
import { setMapLibreWorkerUrl } from '@loidolt/theme-maps';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';

setMapLibreWorkerUrl(workerUrl);
```

and set `worker: { format: 'es' }` in `vite.config`. MapLibre 5 inlines its worker and needs
neither.

The stylesheet layers MapLibre's own CSS under the loidolt components (see _Cascade layers_ in the main
README), so the loidolt control, popup and attribution styles win without `!important`.

```svelte
<script lang="ts">
  import { CircleLayer, MapMarker, MapSource, MapView } from '@loidolt/theme-maps';
</script>

<MapView label="Delivery stops" center={[-122.68, 45.52]} zoom={12}>
  <MapSource id="stops" data={stopsGeoJSON}>
    <CircleLayer id="stop-points" />
  </MapSource>
  <MapMarker lngLat={[-122.66, 45.51]} label="Workshop">
    {#snippet popup()}<strong>Workshop</strong>
      <p>Open 8 to 5</p>{/snippet}
  </MapMarker>
</MapView>
```

## Components

| Component            | What it is                                                                |
| -------------------- | ------------------------------------------------------------------------- |
| `MapView`            | The map: basemap, view state (bindable), controls, keyboard announcements |
| `MapSource`          | GeoJSON or any MapLibre source, with optional clustering                  |
| `FillLayer`          | Filled polygons                                                           |
| `LineLayer`          | Lines                                                                     |
| `CircleLayer`        | Points as circles                                                         |
| `SymbolLayer`        | Text and icons                                                            |
| `FillExtrusionLayer` | Polygons in 3D                                                            |
| `HeatmapLayer`       | Point density on the sequential ramp                                      |
| `RasterLayer`        | Raster tiles or a georeferenced image                                     |
| `MapMarker`          | The loidolt pin as a named button, with an optional popup                 |
| `MapPopup`           | A non-modal panel pointing at a spot                                      |
| `MapControl`         | Any content as a map control                                              |
| `MapLegend`          | Category or gradient key, on the map or beside it                         |
| `MapLegendGroup`     | Several collapsible legends in one control                                |
| `CoordinateDisplay`  | Coordinate under the pointer (or at the centre) and zoom                  |
| `BasemapSwitcher`    | Switch between the loidolt basemap, the plain one, and your own styles    |
| `MapFeatureList`     | Every place as a list that flies the map there — the non-visual route     |
| `LayerManager`       | Show, fade and reorder layers; keyboard reordering, announced             |
| `DeckOverlay`        | deck.gl layers on the map (optional peer)                                 |

Layers take `id`, `source` (or the enclosing `MapSource`), `sourceLayer`, `beforeId`, `filter`,
`minZoom`/`maxZoom`, `visible`, `layout`, `label`, `onClick`, `onHover` and `paint`. `paint` is
merged over themed defaults; pass a function of the colours to follow light and dark:

```svelte
<FillLayer id="zones" paint={(colors) => ({ 'fill-color': colors.categorical[2] })} />
```

## Tiles and attribution

The default basemap uses OpenFreeMap. It needs no key and no account, but it is a free service
with no service-level agreement, and its attribution must stay visible (the attribution control
shows it). Labels use the fonts its glyph server has — Noto Sans — not the page's.

To use other tiles, pass any OpenMapTiles-schema source as a TileJSON URL or `{z}/{x}/{y}`
template, with its attribution:

```svelte
<MapView label="…" tiles="https://tiles.example.com/planet.json" attribution="© Example" />
```

`mapStyle` takes a complete style URL or document instead; it is used as is and not recoloured.

## Styles and helpers without a component

`@loidolt/theme-maps/core` is plain TypeScript with no Svelte and no MapLibre import:

- `createBasemapStyle`, `createBlankStyle`, `basemapPaint` — the styles `MapView` uses, for a
  map you create yourself.
- `boundsOf`, `boundsCenter`, `padBounds`, `boundsContain`, `boundsIntersect`.
- `validateGeoJSON` (catches `[lat, lng]` order), `loadGeoJSON`, `pointsToFeatureCollection`,
  `featureAnchor`.
- `formatCoordinate` (latitude first, with hemispheres; decimal or DMS), `formatDistance`,
  `formatArea`.
- `clusterColor`, `clusterRadius`, `expandCluster`.
- `formatMoveAnnouncement`, `describeZoom`, `MAP_KEYS`.

## Routes and directions

Straight-line routing with no service and no key: `haversine` and `pathLength` (metres),
`distanceMatrix`, and `optimizeRoute(origin, stops)` — nearest neighbour, then 2-opt — which
returns the visiting order, each leg and the total. Hand the order to a phone's maps app with
`googleDirectionsUrl` or `appleDirectionsUrl`; `googleDirectionsLegUrls` splits a long route into
links that each fit Google's waypoint limit, every leg starting where the last one ended.

## Large datasets

- `createSpatialIndex()` — an R-tree over features: `search(bounds)` for what is in view,
  `nearest(point, count)`.
- `simplifyLine`, `simplifyFeatures`, `convexHull`, and `createLevelOfDetail(collection)`, which
  simplifies to what a pixel can show at each zoom and caches per level; `outlineOf(features)`
  collapses a group into one shape for far zooms.
- `createSpatialWorker()` runs the index and simplification in a web worker, falling back to the
  main thread (same answers) where no worker can start. It finds its worker next to itself; if a
  bundler's dependency pre-bundling loses it, import it through the bundler and pass it in:

  ```ts
  import SpatialWorker from '@loidolt/theme-maps/spatial.worker?worker';
  const spatial = createSpatialWorker({ workerFactory: () => new SpatialWorker() });
  ```

## deck.gl

`DeckOverlay` draws deck.gl layers on the map, on a canvas of their own that follows the camera.
`interleaved` draws them in among MapLibre's layers instead, sharing its depth — but it reaches
into MapLibre's renderer, so it needs a deck.gl release that supports your MapLibre major
(deck.gl 9.4 does not yet support MapLibre 6's). deck.gl is an optional peer; register it once
and build your layers as usual:

```ts
import { setDeckLoader } from '@loidolt/theme-maps';
setDeckLoader(() => import('@deck.gl/mapbox'));
```

```svelte
<DeckOverlay layers={[new ScatterplotLayer({ id: 'jobs', data, getPosition, getRadius })]} />
```

## Loading MapLibre yourself

Maps import `maplibre-gl` on first use. To use a global build, or a stand-in under test:

```ts
import { setMapLibreLoader } from '@loidolt/theme-maps';
setMapLibreLoader(() => window.maplibregl);
```

## License

MIT
