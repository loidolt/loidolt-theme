<script lang="ts">
  import { TreemapChart } from '@loidolt/theme-charts';
  import { storage } from '$lib/sample-series.js';
</script>

<TreemapChart title="Storage by shelf" data={storage} dataTable="toggle" />
