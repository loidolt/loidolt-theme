<script lang="ts">
  import { SankeyChart } from '@loidolt/theme-charts';
  import { materialFlow } from '$lib/sample-series.js';
</script>

<SankeyChart title="Where sheet material goes" data={materialFlow} dataTable="toggle" />
