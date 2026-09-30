<script lang="ts">
  import { CandlestickChart } from '@loidolt/theme-charts';
  import { prices } from '$lib/sample-series.js';
</script>

<CandlestickChart
  title="Birch ply price per sheet"
  data={prices}
  valueFormat={{ style: 'currency', currency: 'USD', locale: 'en-US' }}
  zoom
  dataTable="toggle"
/>
