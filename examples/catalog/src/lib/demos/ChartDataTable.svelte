<script lang="ts">
  import { ChartDataTable, categoryTable } from '@loidolt/theme-charts';
  import { monthly } from '$lib/sample-series.js';

  const firstQuarter = {
    categories: monthly.categories.slice(0, 3),
    series: monthly.series,
  };
</script>

<ChartDataTable caption="Sheets cut, first quarter" table={categoryTable(firstQuarter, 'Month')} />
