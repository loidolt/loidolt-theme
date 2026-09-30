<script lang="ts">
  import { Chart } from '@loidolt/theme-charts';
  import { Button } from '@loidolt/theme-svelte';
  import { monthly } from '$lib/sample-series.js';

  const target = monthly.categories.map((_, index) => 50 + index * 4);
  const cut = monthly.series[0].data;
  let failed = $state(false);
</script>

<div class="ldt-stack">
  <Chart
    title="Birch ply against target"
    description="Cuts beat the target from April onwards."
    option={(colors) => ({
      legend: { top: 0, left: 0 },
      tooltip: { trigger: 'axis' },
      grid: { left: 8, right: 16, top: 40, bottom: 8, containLabel: true },
      xAxis: { type: 'category', data: monthly.categories },
      yAxis: { type: 'value' },
      series: [
        { type: 'bar', name: 'Cut', data: cut, itemStyle: { color: colors.categorical[1] } },
        {
          type: 'line',
          name: 'Target',
          data: target,
          showSymbol: false,
          lineStyle: { color: colors.accent, type: 'dashed', width: 2 },
          itemStyle: { color: colors.accent },
        },
      ],
    })}
    table={{
      columns: ['Month', 'Cut', 'Target'],
      rows: monthly.categories.map((month, index) => [month, cut[index], target[index]]),
    }}
    dataTable="toggle"
  />
  <Chart
    title="Last night's export"
    option={{}}
    error={failed ? 'The export service did not answer.' : null}
    onRetry={() => (failed = false)}
    empty={!failed}
    emptyDescription="Nothing has been exported yet."
  />
  <div><Button size="sm" onclick={() => (failed = true)}>Show the error state</Button></div>
</div>
