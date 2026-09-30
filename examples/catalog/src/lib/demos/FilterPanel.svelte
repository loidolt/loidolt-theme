<script lang="ts">
  import { Button, Field, FilterPanel, Select, Toolbar } from '@loidolt/theme-svelte';

  let open = $state(true);
  let stock = $state('');
  let status = $state('');
  const active = $derived([stock, status].filter(Boolean).length);
</script>

<div class="ldt-stack">
  <Toolbar label="Sheet list tools">
    <Button
      size="sm"
      variant="quiet"
      aria-expanded={open}
      aria-controls="demo-filters"
      onclick={() => (open = !open)}>Filters{active ? ` (${active})` : ''}</Button
    >
  </Toolbar>
  <FilterPanel
    id="demo-filters"
    bind:open
    activeCount={active}
    onClear={() => {
      stock = '';
      status = '';
    }}
  >
    <Field label="Stock">
      {#snippet children({ id })}
        <Select
          {id}
          boxed
          placeholder="Any"
          bind:value={stock}
          options={[
            { value: 'birch', label: 'Birch ply' },
            { value: 'acrylic', label: 'Acrylic' },
          ]}
        />
      {/snippet}
    </Field>
    <Field label="Status">
      {#snippet children({ id })}
        <Select
          {id}
          boxed
          placeholder="Any"
          bind:value={status}
          options={[
            { value: 'ready', label: 'Ready' },
            { value: 'review', label: 'In review' },
          ]}
        />
      {/snippet}
    </Field>
  </FilterPanel>
</div>
