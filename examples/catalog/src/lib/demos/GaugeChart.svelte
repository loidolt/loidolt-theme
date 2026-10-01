<script lang="ts">
  import { GaugeChart } from '@loidolt/theme-charts';
</script>

<div class="ldt-grid" style="--ldt-min: 14rem;">
  <GaugeChart title="Bed utilisation" data={{ value: 72 }} label="percent" height={240} />
  <GaugeChart
    title="Queue length"
    data={{ value: 14, min: 0, max: 40 }}
    showProgress={false}
    splitNumber={4}
    height={240}
  />
</div>
