<script lang="ts">
  import { StatusDot } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <div class="ldt-cluster">
    <StatusDot variant="success" label="Approved" /> <span>Approved</span>
  </div>
  <div class="ldt-cluster">
    <StatusDot variant="warning" label="Changes requested" /> <span>Changes requested</span>
  </div>
  <div class="ldt-cluster">
    <StatusDot label="Awaiting review" /> <span>Awaiting review</span>
  </div>
</div>
