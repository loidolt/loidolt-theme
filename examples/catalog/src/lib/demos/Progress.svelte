<script lang="ts">
  import { Progress } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <Progress value={72} label="Generation progress" />
  <Progress label="Uploading" />
  <Progress
    value={9}
    max={12}
    label="Cutting"
    showValue
    formatValue={(value, max) => `${value} of ${max} sheets`}
  />
  <Progress value={100} label="Export" variant="success" size="sm" showValue />
  <Progress value={40} label="Batch" variant="error" size="lg" showValue />
</div>
