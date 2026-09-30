<script lang="ts">
  import { FunnelChart } from '@loidolt/theme-charts';
  import { orderFunnel } from '$lib/sample-series.js';
</script>

<FunnelChart title="Orders this quarter" data={orderFunnel} dataTable="toggle" />
