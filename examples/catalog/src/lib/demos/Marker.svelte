<script lang="ts">
  import { Marker } from '@loidolt/theme-svelte';
</script>

<div class="ldt-cluster">
  <Marker number={1} label="Comment 1" />
  <Marker number={2} active label="Comment 2, highlighted" />
  <Marker number={3} shape="pin" label="Pin 3" />
</div>
