<script lang="ts">
  import { Badge, DropdownMenu, type MenuEntry } from '@loidolt/theme-svelte';

  let selected = $state('no action selected');
  let grid = $state(true);
  let rulers = $state(false);
  let sort = $state('name');

  const items: MenuEntry[] = $derived([
    {
      type: 'group',
      label: 'Document',
      items: [
        { value: 'new', label: 'New document', shortcut: 'Control+N' },
        { value: 'duplicate', label: 'Duplicate', shortcut: 'Control+D' },
        {
          type: 'sub',
          label: 'Export as',
          items: [
            { value: 'svg', label: 'SVG vector' },
            { value: 'pdf', label: 'PDF document' },
          ],
        },
      ],
    },
    { type: 'checkbox', value: 'grid', label: 'Show grid', checked: grid, separatorBefore: true },
    { type: 'checkbox', value: 'rulers', label: 'Show rulers', checked: rulers },
    {
      type: 'radio',
      name: 'sort',
      label: 'Sort by',
      value: sort,
      separatorBefore: true,
      options: [
        { value: 'name', label: 'Name' },
        { value: 'modified', label: 'Last modified' },
      ],
    },
    { value: 'archive', label: 'Archive', destructive: true, separatorBefore: true },
  ]);
</script>

<div class="ldt-cluster">
  <DropdownMenu
    {items}
    onSelect={(value) => (selected = value)}
    onCheckedChange={(value, checked) => (value === 'grid' ? (grid = checked) : (rulers = checked))}
    onValueChange={(_name, value) => (sort = value)}
  >
    {#snippet trigger()}File{/snippet}
  </DropdownMenu>
  <Badge size="md">{selected}</Badge>
  <span class="ldt-utility-text"
    >Grid {grid ? 'on' : 'off'} · rulers {rulers ? 'on' : 'off'} · by {sort}</span
  >
</div>
