<script lang="ts">
  import { SwatchGroup } from '@loidolt/theme-svelte';

  let value = $state('terracotta');
</script>

<SwatchGroup
  label="Accent color"
  bind:value
  options={[
    { value: 'terracotta', label: 'Terracotta', color: '#c94f2a' },
    { value: 'moss', label: 'Moss', color: '#5a7d4a' },
    { value: 'slate', label: 'Slate', color: '#3a6ea5' },
    { value: 'ink', label: 'Ink', color: '#2b2b2b' },
  ]}
/>
