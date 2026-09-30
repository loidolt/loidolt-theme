<script lang="ts">
  import { PieChart } from '@loidolt/theme-charts';
  import { materials } from '$lib/sample-series.js';

  const total = materials.reduce((sum, material) => sum + material.value, 0);
</script>

<div class="ldt-grid" style="--ldt-min: 16rem;">
  <PieChart title="Sheets by material" data={materials} dataTable="toggle" />
  <PieChart
    title="Share of sheets"
    data={materials}
    innerRadius={48}
    centerValue={String(total)}
    centerLabel="sheets"
    showLabels={false}
    showLegend
  />
</div>
