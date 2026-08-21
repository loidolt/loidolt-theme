<script lang="ts">
  import Field from '../../src/lib/components/Field.svelte';
  import Input from '../../src/lib/components/Input.svelte';

  let {
    label = 'Contact email',
    description,
    error,
    optional = false,
  }: { label?: string; description?: string; error?: string; optional?: boolean } = $props();
</script>

<Field {label} {description} {error} {optional}>
  {#snippet children({ id, describedBy, invalid })}
    <Input {id} aria-describedby={describedBy} aria-invalid={invalid} />
  {/snippet}
</Field>
