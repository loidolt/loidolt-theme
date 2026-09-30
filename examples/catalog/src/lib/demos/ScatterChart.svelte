<script lang="ts">
  import { ScatterChart } from '@loidolt/theme-charts';
  import { runs } from '$lib/sample-series.js';
</script>

<ScatterChart
  title="Cut time against path length"
  data={runs}
  showTrendLine
  xAxisName="Path (m)"
  yAxisName="Minutes"
  tableLabels={{ seriesLabel: 'Material', xLabel: 'Path (m)', yLabel: 'Minutes' }}
  dataTable="toggle"
/>
