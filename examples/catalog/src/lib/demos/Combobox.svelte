<script lang="ts">
  import { Combobox, Field } from '@loidolt/theme-svelte';

  let stock = $state('');
</script>

<div class="ldt-stack">
  <Field label="Sheet stock" description="Type to narrow the list.">
    {#snippet children({ id, describedBy, invalid })}
      <Combobox
        {id}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        boxed
        placeholder="Search materials"
        bind:value={stock}
        options={[
          { value: 'birch-3', label: 'Birch ply, 3 mm' },
          { value: 'birch-6', label: 'Birch ply, 6 mm' },
          {
            label: 'Acrylic',
            options: [
              { value: 'clear', label: 'Clear acrylic' },
              { value: 'smoke', label: 'Smoked acrylic' },
              { value: 'mirror', label: 'Mirror acrylic', disabled: true },
            ],
          },
          { value: 'card', label: 'Mount board' },
        ]}
      />
    {/snippet}
  </Field>
  <p class="ldt-utility-text">Value: {stock || 'unset'}</p>
</div>
