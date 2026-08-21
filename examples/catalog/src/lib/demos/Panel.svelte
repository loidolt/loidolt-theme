<script lang="ts">
  import { Panel, Progress, Spinner } from '@loidolt/theme-svelte';
</script>

<Panel title="Fabrication status">
  <div class="ldt-stack">
    <div class="ldt-cluster"><Spinner label="Generating preview" /> Generating preview</div>
    <Progress value={72} label="Generation progress" />
  </div>
</Panel>
