---
'@loidolt/theme-charts': minor
'@loidolt/theme-styles': minor
---

New package: `@loidolt/theme-charts`, accessible ECharts charts painted from the tokens.

- `LineChart` (with `area`), `BarChart`, `PieChart` (with `innerRadius` for a donut), `FunnelChart`, `ScatterChart`, `RadarChart`, `GaugeChart`, `HeatmapChart`, `TreemapChart`, `CandlestickChart` and `SankeyChart`, all built on `Chart`, which themes any ECharts option.
- Every chart is a captioned `<figure>` with a generated plain-language description and its data as a real table — for assistive tech by default, or behind a "Show data table" button. `decal` patterns series; animation follows `prefers-reduced-motion`.
- Colours are read live off the page, so light, dark and custom themes reach the canvas, and a theme change recolours in place. Updates replace the option, so removed series leave the chart.
- ECharts is a peer, loaded in the browser only; each chart registers just the pieces it draws with. The server renders the caption, description and table.
- `@loidolt/theme-charts/core` holds the option builders, describers, table helpers, `applyTheme` and locale-aware formatters as plain TypeScript.
- Styles: chart frame styles in `@loidolt/theme-styles`.
