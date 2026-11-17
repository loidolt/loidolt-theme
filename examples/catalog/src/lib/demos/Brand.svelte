<script lang="ts">
  import { resolve } from '$app/paths';
  import { Brand } from '@loidolt/theme-svelte';
</script>

<div class="ldt-stack">
  <Brand name="Loidolt" meta="Theme" />
  <Brand name="Topo Studio" meta="Project 04" href={resolve('/')} />
</div>
