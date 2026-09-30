<script lang="ts">
  import { Field, PasswordInput } from '@loidolt/theme-svelte';
</script>

<Field label="Password" description="At least 12 characters.">
  {#snippet children({ id, describedBy })}
    <PasswordInput {id} aria-describedby={describedBy} autocomplete="new-password" boxed />
  {/snippet}
</Field>
