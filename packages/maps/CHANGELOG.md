# @loidolt/theme-maps

## 0.10.0

### Patch Changes

- Updated dependencies [[`97c0994`](https://github.com/loidolt/loidolt-theme/commit/97c099432ed2e2d4c1d3a7ad6a658be800fd05cd)]:
  - @loidolt/theme-svelte@0.10.0
  - @loidolt/theme-tokens@0.10.0

## 0.9.1

### Patch Changes

- [#21](https://github.com/loidolt/loidolt-theme/pull/21) [`f4f628b`](https://github.com/loidolt/loidolt-theme/commit/f4f628bd9e8bcb8066cc034948ab0217759d7db5) Thanks [@loidolt](https://github.com/loidolt)! - Fit a `MapView` to the first `bounds` that arrive after it loads. A map created without `bounds` used to treat the first box it was given as already fitted on load, so only a second change moved the view (a route planner opening a saved route stayed put). The load handler now records a box only when it actually fits one, so the map still fits a box given at creation exactly once. Clearing `bounds` also forgets the last box, so passing the same box again fits it again. When `center`/`zoom` and `bounds` change in the same tick, the fit wins.
- Updated dependencies []:
  - @loidolt/theme-svelte@0.9.1
  - @loidolt/theme-tokens@0.9.1

## 0.9.0

### Patch Changes

- Updated dependencies []:
  - @loidolt/theme-svelte@0.9.0
  - @loidolt/theme-tokens@0.9.0

## 0.8.1

### Patch Changes

- Updated dependencies []:
  - @loidolt/theme-tokens@0.8.1
  - @loidolt/theme-svelte@0.8.1

## 0.8.0

### Patch Changes

- Updated dependencies [[`9673e33`](https://github.com/loidolt/loidolt-theme/commit/9673e33cc7b22cb4ff3a5ada2067785b08f191f4)]:
  - @loidolt/theme-tokens@0.8.0
  - @loidolt/theme-svelte@0.8.0

## 0.7.0

### Minor Changes

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - Map extras: layer management, deck.gl, routing and large-data helpers.

  - `LayerManager`: show, fade and reorder a map's layers from a map control; reorder with buttons or Alt + ↑/↓, each move announced and focus kept on the moved layer.
  - `DeckOverlay`: deck.gl layers over the map (or interleaved with its own, where deck.gl supports the MapLibre major). deck.gl is an optional peer, registered with `setDeckLoader`.
  - Routing: `haversine`, `pathLength`, `distanceMatrix`, `optimizeRoute` (nearest neighbour then 2-opt), `measureRoute`, and Google and Apple Maps directions links, split into legs for long routes.
  - Large data: `createSpatialIndex` (R-tree search and nearest), `simplifyLine`/`simplifyFeatures`, `convexHull`, `createLevelOfDetail`, `outlineOf`, and `createSpatialWorker`, which does the indexing and simplification in a web worker (shipped as `@loidolt/theme-maps/spatial.worker`) with a main-thread fallback.

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - New package: `@loidolt/theme-maps`, accessible MapLibre maps painted from the tokens.

  - `MapView` draws a quiet basemap in the loidolt palette from OpenFreeMap's free OpenMapTiles tiles (or any OpenMapTiles-schema tiles, or a style of your own), repaints it in place on a theme change, and binds `center`/`zoom` both ways. `basemap="blank"` needs no network.
  - `MapSource` and seven layers (`FillLayer`, `LineLayer`, `CircleLayer`, `SymbolLayer`, `FillExtrusionLayer`, `HeatmapLayer`, `RasterLayer`) with themed default paint, paint functions that follow the theme, and diffed updates.
  - `MapMarker` (the loidolt pin as a named button, with an optional popup that takes and returns focus), `MapPopup`, `MapControl`, `MapLegend`, `MapLegendGroup`, `CoordinateDisplay`, `BasemapSwitcher`, and `MapFeatureList` — every place as a list, the non-visual way around the map.
  - The canvas is named and described, keyboard moves are announced, and a browser without WebGL gets a message. MapLibre loads in the browser only.
  - `@loidolt/theme-maps/core`: style generators, bounds, GeoJSON validation and loading, coordinate/distance/area formatting, cluster helpers.
  - Styles: map, control, popup, marker, legend and feature-list styles in `@loidolt/theme-styles`, with MapLibre's control icons redrawn to follow the theme.

### Patch Changes

- Updated dependencies [[`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b)]:
  - @loidolt/theme-tokens@0.7.0
  - @loidolt/theme-svelte@0.7.0
