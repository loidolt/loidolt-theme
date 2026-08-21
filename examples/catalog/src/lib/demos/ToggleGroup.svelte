<script lang="ts">
  import { ToggleGroup } from '@loidolt/theme-svelte';

  let tool = $state('select');
  let overlays = $state<string[]>(['grid']);
</script>

<div class="ldt-stack">
  <ToggleGroup
    label="Tool"
    bind:value={tool}
    options={[
      { value: 'select', label: 'Select' },
      { value: 'draw', label: 'Draw' },
      { value: 'measure', label: 'Measure' },
    ]}
  />
  <ToggleGroup
    label="Overlays"
    multiple
    size="sm"
    bind:value={overlays}
    options={[
      { value: 'grid', label: 'Grid' },
      { value: 'guides', label: 'Guides' },
      { value: 'rulers', label: 'Rulers' },
    ]}
  />
  <p class="ldt-utility-text">Tool: {tool} · Overlays: {overlays.join(', ') || 'none'}</p>
</div>
