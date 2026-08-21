<script lang="ts">
  import { Pagination } from '@loidolt/theme-svelte';

  let page = $state(4);
</script>

<div class="ldt-stack">
  <Pagination count={248} perPage={10} bind:page />
  <p class="ldt-utility-text">Showing page {page} of 25</p>
</div>
