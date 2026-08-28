<script lang="ts">
  import { Stat } from '@loidolt/theme-svelte';
</script>

<div class="ldt-grid" id="stat-demo" style="--ldt-min: 9rem;">
  <Stat value={128} label="Artworks" href="#stat-demo" />
  <Stat value="42" label="Jobs this week" />
  <Stat value="97%" label="Approval rate" eyebrow="Proofs" />
</div>
