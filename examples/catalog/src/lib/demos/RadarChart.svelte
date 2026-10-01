<script lang="ts">
  import { RadarChart } from '@loidolt/theme-charts';
  import { machines } from '$lib/sample-series.js';
</script>

<RadarChart title="Machines compared" data={machines} dataTable="toggle" />
