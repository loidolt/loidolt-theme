# @loidolt/theme-charts

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
