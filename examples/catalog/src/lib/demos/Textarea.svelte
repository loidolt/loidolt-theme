<script lang="ts">
  import { Textarea } from '@loidolt/theme-svelte';

  let value = $state('Two sheets, 3mm ply, grain running long.');
</script>

<Textarea aria-label="Fabrication notes" boxed rows={4} bind:value />
