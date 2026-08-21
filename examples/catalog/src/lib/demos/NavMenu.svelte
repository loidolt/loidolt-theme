<script lang="ts">
  import { NavMenu } from '@loidolt/theme-svelte';

  let selected = $state('templates');
</script>

<div class="ldt-cluster">
  <NavMenu
    label="Libraries"
    groupLabel="Reusable resources"
    active
    onSelect={(value) => (selected = value)}
    items={[
      { value: 'templates', label: 'Templates' },
      { value: 'primitives', label: 'Primitives' },
      { value: 'cutouts', label: 'Cutouts' },
    ]}
  />
  <span class="ldt-utility-text">Selected: {selected}</span>
</div>
