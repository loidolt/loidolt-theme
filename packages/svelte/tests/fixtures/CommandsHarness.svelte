<script lang="ts">
  import { untrack } from 'svelte';
  import ShortcutHelp from '../../src/lib/components/ShortcutHelp.svelte';
  import { createCommands } from '../../src/lib/commands.svelte.js';

  let {
    helpShortcut = '?',
    empty = false,
    open = false,
  }: { helpShortcut?: string | null; empty?: boolean; open?: boolean } = $props();

  const commands = createCommands({ platform: 'other' });
  let log = $state<string[]>([]);

  if (!untrack(() => empty)) {
    commands.registerAll([
      {
        id: 'next',
        label: 'Next item',
        group: 'Navigation',
        shortcut: ['Alt+ArrowDown', 'J'],
        handler: () => log.push('next'),
      },
      {
        id: 'save',
        label: 'Save',
        group: 'File',
        shortcut: 'Mod+Shift+S',
        handler: () => log.push('save'),
      },
      { id: 'unbound', label: 'Unbound', handler: () => {} },
    ]);
  }

  $effect(() => commands.listen());
</script>

<button type="button">Before</button>
<p data-testid="log">{log.join(',')}</p>
<p data-testid="count">{commands.list().length}</p>
<ShortcutHelp {commands} shortcut={helpShortcut} {open} />
