<script lang="ts">
  import { Badge, DropdownMenu } from '@loidolt/theme-svelte';

  let selected = $state('no action selected');
</script>

<div class="ldt-cluster">
  <DropdownMenu
    groupLabel="Document"
    onSelect={(value) => (selected = value)}
    items={[
      { value: 'new', label: 'New document', hint: 'Cmd N' },
      { value: 'duplicate', label: 'Duplicate' },
      { value: 'archive', label: 'Archive', separatorBefore: true },
    ]}
  >
    {#snippet trigger()}File{/snippet}
  </DropdownMenu>
  <Badge size="md">{selected}</Badge>
</div>
