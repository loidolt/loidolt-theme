<script lang="ts">
  import { Button, Input, ToggleGroup, Toolbar } from '@loidolt/theme-svelte';

  let view = $state('grid');
</script>

<div class="ldt-stack">
  <Toolbar label="Sheet list tools">
    <Input
      type="search"
      aria-label="Search sheets"
      placeholder="Search sheets"
      boxed
      style="max-width: 16rem"
    />
    <Button size="sm" variant="quiet">Filters</Button>
    <span class="ldt-utility-text">24 sheets</span>
    {#snippet end()}
      <ToggleGroup
        label="View"
        size="sm"
        bind:value={view}
        options={[
          { value: 'grid', label: 'Grid' },
          { value: 'list', label: 'List' },
        ]}
      />
    {/snippet}
  </Toolbar>
  <Toolbar label="Text formatting" roving>
    <Button size="sm" variant="quiet" data-roving-item>Bold</Button>
    <Button size="sm" variant="quiet" data-roving-item>Italic</Button>
    <Button size="sm" variant="quiet" data-roving-item>Underline</Button>
  </Toolbar>
</div>
