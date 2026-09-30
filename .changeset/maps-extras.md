---
'@loidolt/theme-maps': minor
'@loidolt/theme-styles': minor
---

Map extras: layer management, deck.gl, routing and large-data helpers.

- `LayerManager`: show, fade and reorder a map's layers from a map control; reorder with buttons or Alt + ↑/↓, each move announced and focus kept on the moved layer.
- `DeckOverlay`: deck.gl layers over the map (or interleaved with its own, where deck.gl supports the MapLibre major). deck.gl is an optional peer, registered with `setDeckLoader`.
- Routing: `haversine`, `pathLength`, `distanceMatrix`, `optimizeRoute` (nearest neighbour then 2-opt), `measureRoute`, and Google and Apple Maps directions links, split into legs for long routes.
- Large data: `createSpatialIndex` (R-tree search and nearest), `simplifyLine`/`simplifyFeatures`, `convexHull`, `createLevelOfDetail`, `outlineOf`, and `createSpatialWorker`, which does the indexing and simplification in a web worker (shipped as `@loidolt/theme-maps/spatial.worker`) with a main-thread fallback.
