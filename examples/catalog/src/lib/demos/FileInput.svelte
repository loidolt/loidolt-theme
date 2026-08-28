<script lang="ts">
  import { Field, FileInput } from '@loidolt/theme-svelte';

  let picked = $state('');
</script>

<div class="ldt-stack">
  <Field label="Artwork file">
    {#snippet children({ id })}
      <FileInput
        {id}
        accept=".svg,image/svg+xml"
        boxed
        onFiles={(files) => (picked = files[0]?.name ?? '')}
      />
    {/snippet}
  </Field>
  {#if picked}<p class="ldt-muted">Picked: {picked}</p>{/if}
</div>
