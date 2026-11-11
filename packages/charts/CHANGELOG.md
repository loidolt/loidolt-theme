# @loidolt/theme-charts

## 0.12.1

### Patch Changes

- [#75](https://github.com/loidolt/loidolt-theme/pull/75) [`ecdf7a1`](https://github.com/loidolt/loidolt-theme/commit/ecdf7a14ab2500a15a96775b8f8b430cac89acbd) Thanks [@loidolt](https://github.com/loidolt)! - Published through npm trusted publishing: the release job proves who it is to npm with a short-lived GitHub token instead of a stored one. No code changes.
- Updated dependencies [[`ecdf7a1`](https://github.com/loidolt/loidolt-theme/commit/ecdf7a14ab2500a15a96775b8f8b430cac89acbd)]:
  - @loidolt/theme-tokens@0.12.1
  - @loidolt/theme-svelte@0.12.1

## 0.12.0

### Patch Changes

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`144ac83`](https://github.com/loidolt/loidolt-theme/commit/144ac8398b65beaa3dc6eac75ab059aaf2017490) Thanks [@loidolt](https://github.com/loidolt)! - A pie's outside labels keep whole words on a phone-width chart, on shorter leader lines that leave the name room beside the pie, and a scatter chart's trend line shares its series' legend entry and colour, so the legend no longer pages and clips an item mid-word.

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`16488e4`](https://github.com/loidolt/loidolt-theme/commit/16488e4f013e0a476bdc1481a6f4e82e31f4c536) Thanks [@loidolt](https://github.com/loidolt)! - Read better on a phone. MapView folds the map attribution behind its (i) button once a map no wider than 640px has loaded, as MapLibre would after the first drag, instead of leaving it open over a fifth of the map. PieChart's outside labels run to the chart's edges and wrap there, on a slightly smaller pie, rather than off the canvas; ScatterChart puts the x axis name under the axis and leaves room above the y name; CandlestickChart's zoom slider is tall enough to grab by touch; and ChartDataTable heads a column of numbers from the side its figures line up on. A Mermaid diagram stops shrinking at three quarters of its drawn width and scrolls sideways instead of shrinking its labels to a few pixels.

- [#72](https://github.com/loidolt/loidolt-theme/pull/72) [`a35eb76`](https://github.com/loidolt/loidolt-theme/commit/a35eb762a4bfd8ada0c235a6d30459f0c31d3ae7) Thanks [@loidolt](https://github.com/loidolt)! - More phone polish. Topbar's actions sit beside the brand while they fit on a compact screen, instead of always taking a row of their own. On a phone, Slider and Progress put their readouts above the track, so the tracks keep the full width and line up; ImageViewer's fit buttons share out their row, and its zoom buttons are boxed; MarkdownPage's previous and next cards stack full width; and an empty chart's message no longer takes the chart's full height. Switch labels take the same face and size as checkbox and radio labels; SwatchGroup's swatches sit clear of their legend; in a CommentList with numbered comments an unnumbered reply lines up with their text; task-list boxes match their text; and footnote back-links and heading anchors take a 44px press on touch. HeatmapChart names the ends of its scale and sets cell values at 11px; TreemapChart names the first stop of its breadcrumb after the chart's title, which also gives it room to be pressed; a scrolling legend's page arrows are larger; and SankeyChart leaves room for the last node's label. CodeSnippet shows the language at the left of its copy bar when there is no filename.
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

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - New package: `@loidolt/theme-charts`, accessible ECharts charts painted from the tokens.

  - `LineChart` (with `area`), `BarChart`, `PieChart` (with `innerRadius` for a donut), `FunnelChart`, `ScatterChart`, `RadarChart`, `GaugeChart`, `HeatmapChart`, `TreemapChart`, `CandlestickChart` and `SankeyChart`, all built on `Chart`, which themes any ECharts option.
  - Every chart is a captioned `<figure>` with a generated plain-language description and its data as a real table — for assistive tech by default, or behind a "Show data table" button. `decal` patterns series; animation follows `prefers-reduced-motion`.
  - Colours are read live off the page, so light, dark and custom themes reach the canvas, and a theme change recolours in place. Updates replace the option, so removed series leave the chart.
  - ECharts is a peer, loaded in the browser only; each chart registers just the pieces it draws with. The server renders the caption, description and table.
  - `@loidolt/theme-charts/core` holds the option builders, describers, table helpers, `applyTheme` and locale-aware formatters as plain TypeScript.
  - Styles: chart frame styles in `@loidolt/theme-styles`.

### Patch Changes

- Updated dependencies [[`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b)]:
  - @loidolt/theme-tokens@0.7.0
  - @loidolt/theme-svelte@0.7.0
