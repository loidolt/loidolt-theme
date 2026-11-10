<script lang="ts">
  import {
    Button,
    createAnnouncer,
    createCommands,
    Field,
    Input,
    LiveRegion,
    ShortcutHelp,
    Switch,
  } from '@loidolt/theme-svelte';

  const sheets = ['Cover', 'Site plan', 'Floor plan', 'Elevations', 'Details'];
  let index = $state(0);
  let zoom = $state(100);
  let singleKey = $state(true);
  let log = $state<string[]>([]);

  const announcer = createAnnouncer();
  const commands = createCommands();

  const record = (entry: string) => {
    log = [entry, ...log].slice(0, 5);
    announcer.announce(entry);
  };

  commands.registerAll([
    {
      id: 'next',
      label: 'Next sheet',
      group: 'Navigation',
      shortcut: 'Alt+ArrowDown',
      enabled: () => index < sheets.length - 1,
      handler: () => record(`Next sheet: ${sheets[++index]}`),
    },
    {
      id: 'previous',
      label: 'Previous sheet',
      group: 'Navigation',
      shortcut: 'Alt+ArrowUp',
      enabled: () => index > 0,
      handler: () => record(`Previous sheet: ${sheets[--index]}`),
    },
    {
      id: 'zoom-in',
      label: 'Zoom in',
      group: 'View',
      shortcut: ['Alt+=', 'Alt++'],
      enabled: () => zoom < 200,
      handler: () => record(`Zoom ${(zoom += 25)}%`),
    },
    {
      id: 'zoom-out',
      label: 'Zoom out',
      group: 'View',
      shortcut: 'Alt+-',
      enabled: () => zoom > 50,
      handler: () => record(`Zoom ${(zoom -= 25)}%`),
    },
    {
      id: 'save',
      label: 'Save',
      group: 'File',
      shortcut: 'Mod+S',
      // A chord no text field uses, so it works while typing a note too.
      allowInInputs: true,
      handler: () => record('Saved'),
    },
  ]);

  $effect(() => commands.listen());
</script>

<div class="ldt-stack">
  <p>
    Sheet {index + 1} of {sheets.length}: <strong>{sheets[index]}</strong> at {zoom}%
  </p>
  <div class="ldt-cluster">
    <Button size="sm" onclick={() => commands.execute('previous')}>Previous</Button>
    <Button size="sm" onclick={() => commands.execute('next')}>Next</Button>
    <Button size="sm" variant="quiet" onclick={() => commands.execute('zoom-out')}>Zoom out</Button>
    <Button size="sm" variant="quiet" onclick={() => commands.execute('zoom-in')}>Zoom in</Button>
    <ShortcutHelp {commands} shortcut={singleKey ? '?' : null} triggerSize="sm">
      {#snippet trigger()}Keyboard shortcuts{/snippet}
    </ShortcutHelp>
  </div>
  <Switch bind:checked={singleKey}>Open shortcuts with ?</Switch>
  <Field label="Note" description="Typing here never runs a shortcut, except Save.">
    {#snippet children({ id, describedBy })}
      <Input {id} aria-describedby={describedBy} boxed />
    {/snippet}
  </Field>
  <div>
    <p class="ldt-eyebrow">Last run</p>
    {#if log.length}
      <ol data-testid="command-log">
        {#each log as entry, position (position)}<li>{entry}</li>{/each}
      </ol>
    {:else}
      <p class="ldt-muted" data-testid="command-log">
        Nothing yet. Press Alt+↓, or ? for the list.
      </p>
    {/if}
  </div>
  <LiveRegion message={announcer.message} politeness={announcer.politeness} />
</div>
