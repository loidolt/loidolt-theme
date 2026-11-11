---
'@loidolt/theme-maps': patch
'@loidolt/theme-charts': patch
'@loidolt/theme-docs': patch
---

Read better on a phone. MapView folds the map attribution behind its (i) button once a map no wider than 640px has loaded, as MapLibre would after the first drag, instead of leaving it open over a fifth of the map. PieChart's outside labels run to the chart's edges and wrap there, on a slightly smaller pie, rather than off the canvas; ScatterChart puts the x axis name under the axis and leaves room above the y name; CandlestickChart's zoom slider is tall enough to grab by touch; and ChartDataTable heads a column of numbers from the side its figures line up on. A Mermaid diagram stops shrinking at three quarters of its drawn width and scrolls sideways instead of shrinking its labels to a few pixels.
