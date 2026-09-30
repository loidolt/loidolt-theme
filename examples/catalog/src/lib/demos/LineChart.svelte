<script lang="ts">
  import { LineChart } from '@loidolt/theme-charts';
  import { monthly } from '$lib/sample-series.js';
</script>

<div class="ldt-grid" style="--ldt-min: 18rem;">
  <LineChart title="Sheets cut per month" data={monthly} dataTable="toggle" />
  <LineChart
    title="Sheets cut, stacked"
    data={monthly}
    area
    stacked
    showPoints={false}
    categoryLabel="Month"
  />
</div>
