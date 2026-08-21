<script lang="ts">
  import { ThemeToggle } from '@loidolt/theme-svelte';
  import { theme } from '$lib/theme.js';
</script>

<div class="ldt-stack">
  <ThemeToggle {theme} />
  <p class="ldt-utility-text">
    Preference: {theme.preference} / resolved: {theme.resolved} / system: {theme.system}
  </p>
</div>
