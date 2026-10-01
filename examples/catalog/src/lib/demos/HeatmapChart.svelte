<script lang="ts">
  import { HeatmapChart } from '@loidolt/theme-charts';
  import { busyHours } from '$lib/sample-series.js';
</script>

<HeatmapChart
  title="Jobs started by hour"
  data={busyHours}
  showValues
  cornerLabel="Time"
  dataTable="toggle"
/>
