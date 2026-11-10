<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { Commands } from '../commands.svelte.js';
  import {
    describeShortcut,
    shortcutKeys,
    type ParsedShortcut,
    type ShortcutNames,
  } from '../shortcuts.js';
  import type { ActionVariant, ControlSize, DialogSize, HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';
  import Dialog from './Dialog.svelte';

  interface Props {
    /** The registry to list. Commands without a shortcut are left out. */
    commands: Commands;
    open?: boolean;
    title?: string;
    description?: string;
    /**
     * The key that opens this dialog, registered on `commands` while mounted. `null` registers
     * nothing. A single-character shortcut is one a speech-input user can trigger by accident
     * (WCAG 2.1.4): give people a way to turn it off, as the catalog demo does.
     */
    shortcut?: string | null;
    commandId?: string;
    /** The registered command's label, as it appears in the list and in a native menu. */
    commandLabel?: string;
    commandGroup?: string;
    /** Heading for commands registered without a `group`, shown when other groups exist. */
    ungroupedLabel?: string;
    /** Between two shortcuts for the same command. */
    orLabel?: string;
    emptyLabel?: string;
    /** Words for the screen-reader reading of each shortcut, for translation. */
    keyNames?: Partial<ShortcutNames>;
    /** Optional visible trigger, rendered inside a button. Focus returns to it on close. */
    trigger?: Snippet;
    triggerVariant?: ActionVariant;
    triggerSize?: ControlSize;
    triggerClass?: string;
    size?: DialogSize;
    /** Level of the dialog title; group headings sit one below. */
    headingLevel?: HeadingLevel;
    closeLabel?: string;
    /** `class` lands on the dialog content. */
    class?: string;
    onOpenChange?: (open: boolean) => void;
    ref?: HTMLElement | null;
  }

  let {
    commands,
    open = $bindable(false),
    title = 'Keyboard shortcuts',
    description,
    shortcut = '?',
    commandId = 'shortcut-help',
    commandLabel = 'Show keyboard shortcuts',
    commandGroup,
    ungroupedLabel = 'General',
    orLabel = 'or',
    emptyLabel = 'No keyboard shortcuts.',
    keyNames,
    trigger,
    triggerVariant,
    triggerSize,
    triggerClass,
    size,
    headingLevel = 2,
    closeLabel,
    class: className,
    onOpenChange,
    ref = $bindable(null),
  }: Props = $props();

  $effect(() => {
    if (shortcut === null) return;
    return commands.register({
      id: commandId,
      label: commandLabel,
      group: commandGroup,
      shortcut,
      handler: () => {
        open = true;
      },
    });
  });

  const groups = $derived(
    commands
      .groups()
      .map((group) => ({
        ...group,
        commands: group.commands.filter((command) => command.shortcuts.length > 0),
      }))
      .filter((group) => group.commands.length > 0)
  );
  const named = $derived(groups.some((group) => group.group !== undefined));
  const subheading = $derived(`h${Math.min(headingLevel + 1, 6)}`);

  const spoken = (parsed: ParsedShortcut) =>
    describeShortcut(parsed, { platform: commands.platform, names: keyNames });
</script>

<Dialog
  bind:open
  bind:ref
  {title}
  {description}
  {trigger}
  {triggerVariant}
  {triggerSize}
  {triggerClass}
  {size}
  {headingLevel}
  {closeLabel}
  {onOpenChange}
  class={cx('ldt-shortcut-help', className)}
>
  {#if groups.length === 0}
    <p class="ldt-shortcut-help__empty">{emptyLabel}</p>
  {:else}
    {#each groups as group (group.group)}
      <div class="ldt-shortcut-help__group">
        {#if named}<svelte:element this={subheading} class="ldt-shortcut-help__heading"
            >{group.group ?? ungroupedLabel}</svelte:element
          >{/if}
        <dl class="ldt-shortcut-help__list">
          {#each group.commands as command (command.id)}
            <div class="ldt-shortcut-help__row">
              <dt class="ldt-shortcut-help__label">{command.label}</dt>
              <dd class="ldt-shortcut-help__keys">
                {#each command.shortcuts as parsed, index (parsed.source)}{#if index > 0}<span
                      class="ldt-shortcut-help__or">{orLabel}</span
                    >{/if}<kbd class="ldt-kbd-chord" aria-hidden="true"
                    >{#each shortcutKeys(parsed, commands.platform) as key, keyIndex (keyIndex)}<kbd
                        class="ldt-kbd">{key}</kbd
                      >{/each}</kbd
                  ><span class="ldt-sr-only">{spoken(parsed)}</span>{/each}
              </dd>
            </div>
          {/each}
        </dl>
      </div>
    {/each}
  {/if}
</Dialog>
