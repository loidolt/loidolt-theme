<script lang="ts">
  import { Field, NumberField, Sidebar, Switch } from '@loidolt/theme-svelte';

  let layers = $state(12);
  let guides = $state(true);
</script>

<div class="docs-frame" style="max-width:20rem">
  <Sidebar label="Configuration">
    <p class="ldt-eyebrow">Configuration</p>
    <div class="ldt-stack">
      <Field label="Layers">
        {#snippet children({ id })}
          <NumberField {id} bind:value={layers} min={1} max={40} label="Layers" />
        {/snippet}
      </Field>
      <Switch bind:checked={guides}>Contour guides</Switch>
    </div>
  </Sidebar>
</div>
