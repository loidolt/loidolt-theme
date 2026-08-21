<script lang="ts">
  import { Field, Input, Textarea } from '@loidolt/theme-svelte';

  let email = $state('studio@');
  let notes = $state('Clean materials, exact dimensions.');

  const error = $derived(
    email.includes('@') && email.split('@')[1] ? undefined : 'Enter a complete address'
  );
</script>

<div class="ldt-stack">
  <Field label="Delivery email" description="Used only for delivery updates." {error}>
    {#snippet children({ id, describedBy, invalid })}
      <Input
        {id}
        type="email"
        bind:value={email}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        boxed
      />
    {/snippet}
  </Field>
  <Field label="Project note" optional>
    {#snippet children({ id, describedBy })}
      <Textarea {id} bind:value={notes} aria-describedby={describedBy} boxed />
    {/snippet}
  </Field>
</div>
