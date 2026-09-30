# @loidolt/theme-charts

Accessible, themed [ECharts](https://echarts.apache.org) charts for Svelte 5, painted from the
Loidolt tokens.

- **Themed from the tokens.** Series take the eight categorical chart colours, heatmaps the
  sequential ramp, candlesticks the gain and loss colours, axes and tooltips the surface, border
  and text roles — read live off the page, so light, dark and your own theme all reach the canvas.
  A theme change recolours the chart in place.
- **Accessible by default.** Every chart is a `<figure>` whose caption names the picture. A
  plain-language description is generated from the data (trend, extremes, largest share), and the
  data itself is rendered as a real table for assistive tech — or behind a "Show data table"
  button, or always. `decal` adds patterns so series never rely on colour alone. Animation is off
  when the user prefers reduced motion.
- **Server-rendered.** ECharts loads only in the browser, from an effect. The server renders the
  caption, the description and the data table, so the numbers are in the page before any script
  runs.
- **Pay for what you draw.** Each chart registers only the ECharts pieces it uses.

## Install

```sh
npm install @loidolt/theme-charts echarts
```

`echarts` (5.5 or 6) is a peer dependency. The chart styles ship with `@loidolt/theme-styles`,
which you already import for the rest of the system.

```svelte
<script lang="ts">
  import { LineChart } from '@loidolt/theme-charts';

  const data = {
    categories: ['Jan', 'Feb', 'Mar', 'Apr'],
    series: [
      { name: 'Cut', data: [42, 48, 51, 63] },
      { name: 'Scrap', data: [6, 5, 7, 4] },
    ],
  };
</script>

<LineChart title="Sheets per month" {data} dataTable="toggle" />
```

## Components

| Component          | Draws                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| `LineChart`        | Lines over shared categories; `area` fills under them, `stacked` stacks |
| `BarChart`         | Bars, vertical or horizontal, side by side or stacked                   |
| `PieChart`         | Parts of a whole; `innerRadius` makes a donut with a centre label       |
| `FunnelChart`      | Stages narrowing from first to last                                     |
| `ScatterChart`     | `[x, y]` points, with optional least-squares trend lines                |
| `RadarChart`       | Several series across the same measures                                 |
| `GaugeChart`       | One reading on a scale                                                  |
| `HeatmapChart`     | A grid of values coloured on the sequential ramp                        |
| `TreemapChart`     | Nested sizes; click a group to zoom into it                             |
| `CandlestickChart` | Open, high, low and close per period, with optional volume and zoom     |
| `SankeyChart`      | Flows between named nodes                                               |
| `Chart`            | Any ECharts option, themed — the base every chart above is built on     |
| `ChartDataTable`   | A chart's data as a table, visible or for assistive tech only           |

Every chart takes the same frame props as `Chart`: `title`, `hideTitle`, `description`,
`height`, `loading`, `error` with `onRetry`, `empty`, `dataTable`, `renderer`, `decal`,
`animation`, `onItemClick` and a bindable `instance`. User-facing strings (`showTableLabel`,
`emptyTitle`, table headings…) are props with English defaults.

## Any option, themed

`Chart` takes a plain ECharts option, or a function of the resolved theme colours:

```svelte
<Chart
  title="Cuts against target"
  option={(colors) => ({
    xAxis: { type: 'category', data: days },
    yAxis: { type: 'value' },
    series: [
      { type: 'bar', data: cuts },
      { type: 'line', data: target, lineStyle: { color: colors.accent, type: 'dashed' } },
    ],
  })}
  table={{ columns: ['Day', 'Cuts', 'Target'], rows }}
/>
```

Whatever the option leaves unset — the palette, axis and gridline colours, the tooltip, legend
text — is filled in from the theme. Updates replace the option, so a series removed from the data
leaves the chart; pass `merge` to keep zoom and legend state across updates instead.

## Building options without a component

`@loidolt/theme-charts/core` is plain TypeScript with no Svelte and no ECharts import — safe in
a server `load`, a worker or a test:

```ts
import { buildBarOption, describeBar, categoryTable } from '@loidolt/theme-charts/core';
import { chartColors } from '@loidolt/theme-tokens';

const option = buildBarOption(data, { stacked: true }, chartColors('dark'));
```

Each chart has a builder (`buildLineOption`, `buildPieOption`, …), a describer (`describeLine`,
…) and a table helper (`categoryTable`, `sliceTable`, …). Builders throw a `RangeError` on data
that cannot be drawn — a series shorter than its categories, a negative slice, a candle whose
range does not hold its body. `applyTheme(option, colors)` themes any option;
`formatNumber`, `formatCompact`, `formatPercent`, `formatCurrency` and `formatDate` take an
explicit `locale`, which you should pass when a chart is server-rendered.

## Loading ECharts yourself

Charts import `echarts/core` on first use. To use a global build from a script tag, or a stand-in
under test, register a loader once:

```ts
import { setEChartsLoader } from '@loidolt/theme-charts';
setEChartsLoader(() => window.echarts);
```

If ECharts cannot be loaded at all, the chart says so and shows its data table instead.

## License

MIT
