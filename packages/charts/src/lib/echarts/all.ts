/*
 * Every chart type and component the wrappers use, for the generic `<Chart>` whose option can
 * hold anything. Pass narrower `extensions` to `<Chart>` to ship less.
 */
import {
  BarChart,
  CandlestickChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  TreemapChart,
} from 'echarts/charts';
import {
  DataZoomComponent,
  MarkLineComponent,
  RadarComponent,
  VisualMapComponent,
} from 'echarts/components';

export default [
  BarChart,
  CandlestickChart,
  FunnelChart,
  GaugeChart,
  HeatmapChart,
  LineChart,
  PieChart,
  RadarChart,
  SankeyChart,
  ScatterChart,
  TreemapChart,
  DataZoomComponent,
  MarkLineComponent,
  RadarComponent,
  VisualMapComponent,
];
