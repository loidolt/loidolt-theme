<script lang="ts">
  import { BarChart } from '@loidolt/theme-charts';
  import { materials, monthly } from '$lib/sample-series.js';

  const quarter = {
    categories: monthly.categories.slice(0, 4),
    series: monthly.series,
  };
</script>

<div class="ldt-grid" style="--ldt-min: 18rem;">
  <BarChart title="First four months by material" data={quarter} dataTable="toggle" decal />
  <BarChart
    title="Sheets used this year"
    data={{
      categories: materials.map((m) => m.name),
      series: [{ name: 'Sheets', data: materials.map((m) => m.value) }],
    }}
    orientation="horizontal"
    showValues
    categoryLabel="Material"
  />
</div>
