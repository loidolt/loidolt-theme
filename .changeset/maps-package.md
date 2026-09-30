---
'@loidolt/theme-maps': minor
'@loidolt/theme-styles': minor
---

New package: `@loidolt/theme-maps`, accessible MapLibre maps painted from the tokens.

- `MapView` draws a quiet basemap in the loidolt palette from OpenFreeMap's free OpenMapTiles tiles (or any OpenMapTiles-schema tiles, or a style of your own), repaints it in place on a theme change, and binds `center`/`zoom` both ways. `basemap="blank"` needs no network.
- `MapSource` and seven layers (`FillLayer`, `LineLayer`, `CircleLayer`, `SymbolLayer`, `FillExtrusionLayer`, `HeatmapLayer`, `RasterLayer`) with themed default paint, paint functions that follow the theme, and diffed updates.
- `MapMarker` (the loidolt pin as a named button, with an optional popup that takes and returns focus), `MapPopup`, `MapControl`, `MapLegend`, `MapLegendGroup`, `CoordinateDisplay`, `BasemapSwitcher`, and `MapFeatureList` — every place as a list, the non-visual way around the map.
- The canvas is named and described, keyboard moves are announced, and a browser without WebGL gets a message. MapLibre loads in the browser only.
- `@loidolt/theme-maps/core`: style generators, bounds, GeoJSON validation and loading, coordinate/distance/area formatting, cluster helpers.
- Styles: map, control, popup, marker, legend and feature-list styles in `@loidolt/theme-styles`, with MapLibre's control icons redrawn to follow the theme.
