<script lang="ts">
  import { Popover, Separator } from '@loidolt/theme-svelte';
</script>

<Popover>
  {#snippet trigger()}Project details{/snippet}
  <div class="ldt-stack">
    <strong>Crater Lake</strong>
    <span class="ldt-utility-text">42.9446 N / 122.1090 W</span>
    <Separator />
    <span>12 fabrication layers</span>
  </div>
</Popover>
