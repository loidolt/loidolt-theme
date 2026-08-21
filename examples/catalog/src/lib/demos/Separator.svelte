<script lang="ts">
  import { Separator } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <span>Above</span>
  <Separator />
  <span>Below</span>
  <div class="ldt-cluster">
    <span>Left</span>
    <Separator orientation="vertical" />
    <span>Right</span>
  </div>
</div>
