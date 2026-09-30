<script lang="ts" generics="T extends string">
  import { Combobox as ComboboxPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { Option } from '../types.js';
  import { isOptionGroup, type OptionEntry } from './options.js';

  /*
   * The option rows shared by `Combobox` and `MultiSelect`. Rendered inside a Bits combobox
   * Content, whose context the Item and Group parts pick up.
   */
  interface Props {
    entries: OptionEntry<T>[];
    item?: Snippet<[Option<T>, { selected: boolean; highlighted: boolean }]>;
    /** Extra reason to disable a row — `MultiSelect` uses it once `max` is reached. */
    blocked?: (option: Option<T>) => boolean;
  }

  let { entries, item, blocked }: Props = $props();
</script>

{#snippet row(option: Option<T>, groupDisabled: boolean)}
  <ComboboxPrimitive.Item
    class="ldt-listbox__item"
    value={option.value}
    label={option.label}
    disabled={groupDisabled || option.disabled || blocked?.(option)}
  >
    {#snippet children({ selected, highlighted })}
      {#if item}{@render item(option, { selected, highlighted })}{:else}<span>{option.label}</span
        >{/if}<span class="ldt-listbox__check" aria-hidden="true"></span>
    {/snippet}
  </ComboboxPrimitive.Item>
{/snippet}

{#each entries as entry (isOptionGroup(entry) ? `group:${entry.label}` : entry.value)}
  {#if isOptionGroup(entry)}
    <ComboboxPrimitive.Group class="ldt-listbox__group">
      <ComboboxPrimitive.GroupHeading class="ldt-listbox__heading"
        >{entry.label}</ComboboxPrimitive.GroupHeading
      >
      {#each entry.options as option (option.value)}{@render row(
          option,
          Boolean(entry.disabled)
        )}{/each}
    </ComboboxPrimitive.Group>
  {:else}
    {@render row(entry, false)}
  {/if}
{/each}
