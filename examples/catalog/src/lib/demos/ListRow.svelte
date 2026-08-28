<script lang="ts">
  import { Badge, ListRow } from '@loidolt/theme-svelte';

  let selected = $state('two');
</script>

<div class="ldt-stack" style="--ldt-gap: 0;">
  {#each ['one', 'two', 'three'] as id (id)}
    <ListRow selected={selected === id} onclick={() => (selected = id)}>
      <span style="flex: 1;">Parameter {id}</span>
      <Badge>text</Badge>
    </ListRow>
  {/each}
</div>
