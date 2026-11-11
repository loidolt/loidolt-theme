# @loidolt/theme-maps

## 0.12.0

### Patch Changes

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`16488e4`](https://github.com/loidolt/loidolt-theme/commit/16488e4f013e0a476bdc1481a6f4e82e31f4c536) Thanks [@loidolt](https://github.com/loidolt)! - Read better on a phone. MapView folds the map attribution behind its (i) button once a map no wider than 640px has loaded, as MapLibre would after the first drag, instead of leaving it open over a fifth of the map. PieChart's outside labels run to the chart's edges and wrap there, on a slightly smaller pie, rather than off the canvas; ScatterChart puts the x axis name under the axis and leaves room above the y name; CandlestickChart's zoom slider is tall enough to grab by touch; and ChartDataTable heads a column of numbers from the side its figures line up on. A Mermaid diagram stops shrinking at three quarters of its drawn width and scrolls sideways instead of shrinking its labels to a few pixels.
- Updated dependencies [[`1b5678a`](https://github.com/loidolt/loidolt-theme/commit/1b5678aa6b552c96c3d74bd6f2cec0e97d81a625), [`e8a4555`](https://github.com/loidolt/loidolt-theme/commit/e8a45557d45db822dec2ccc60becafd234b272a9), [`a25b900`](https://github.com/loidolt/loidolt-theme/commit/a25b900a5e99317cf1034bc31772de2616f879b4), [`64f2b57`](https://github.com/loidolt/loidolt-theme/commit/64f2b577ac84803f8ffacc0fc328292b352b12ac), [`95f22c5`](https://github.com/loidolt/loidolt-theme/commit/95f22c5a29d10d0685e81515de36fbf7e5f9bede), [`a35eb76`](https://github.com/loidolt/loidolt-theme/commit/a35eb762a4bfd8ada0c235a6d30459f0c31d3ae7), [`157376e`](https://github.com/loidolt/loidolt-theme/commit/157376e13798aeed7d3d8307396054c6569c3818), [`4f60a5b`](https://github.com/loidolt/loidolt-theme/commit/4f60a5bf8f8ee0fe22d0b0af0034acc1b1311b31), [`faf3870`](https://github.com/loidolt/loidolt-theme/commit/faf387081d52dade60eb56ff95d27ea95a94ed79), [`f1c68a4`](https://github.com/loidolt/loidolt-theme/commit/f1c68a438cbb394adb63794ca4016e95c586612f), [`f912288`](https://github.com/loidolt/loidolt-theme/commit/f912288a6453e5a2015a86bb2bf902c593a66ada)]:
  - @loidolt/theme-svelte@0.12.0
  - @loidolt/theme-tokens@0.12.0

## 0.11.1

### Patch Changes

- Updated dependencies []:
  - @loidolt/theme-svelte@0.11.1
  - @loidolt/theme-tokens@0.11.1

## 0.11.0

### Patch Changes

- Updated dependencies [[`215e78f`](https://github.com/loidolt/loidolt-theme/commit/215e78f4aff68f787514dd51eae6e45e5dff09b0)]:
  - @loidolt/theme-svelte@0.11.0
  - @loidolt/theme-tokens@0.11.0

## 0.10.1

### Patch Changes

- Updated dependencies []:
  - @loidolt/theme-svelte@0.10.1
  - @loidolt/theme-tokens@0.10.1

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
