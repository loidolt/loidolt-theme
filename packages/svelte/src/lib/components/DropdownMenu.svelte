<script lang="ts" generics="T extends string = string">
  import { DropdownMenu as MenuPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { DropdownMenuContentProps } from 'bits-ui';
  import type { Alignment, MenuEntry, Placement, TriggerChildProps } from '../types.js';
  import { cx } from '../utils.js';

  type Props = Omit<DropdownMenuContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    /** Heading rendered above `items`, associated with them via a menu group. */
    groupLabel?: string;
    trigger?: Snippet;
    /** Full control of the trigger element — receives the props Bits needs on it. */
    triggerChild?: Snippet<[TriggerChildProps]>;
    triggerClass?: string;
    /**
     * Declarative rows: plain items, plus `type: 'group' | 'checkbox' | 'radio' | 'sub'` entries
     * for headings, toggles, one-of-many choices and nested menus. Ignored when `children` is
     * provided.
     */
    items?: MenuEntry<T>[];
    /** Escape hatch: compose the menu body yourself from the re-exported primitives. */
    children?: Snippet;
    side?: Placement;
    align?: Alignment;
    sideOffset?: number;
    /** `class` lands on the portaled Content element. */
    class?: string;
    /** An action row was chosen. */
    onSelect?: (value: T) => void;
    /** A `checkbox` entry was toggled. Update its `checked` in your `items`. */
    onCheckedChange?: (value: T, checked: boolean) => void;
    /** A `radio` group's choice changed. Update its `value` in your `items`. */
    onValueChange?: (name: string, value: T) => void;
    onOpenChange?: (open: boolean) => void;
    ref?: HTMLElement | null;
  };

  let {
    open = $bindable(false),
    groupLabel,
    trigger,
    triggerChild,
    triggerClass = 'ldt-button ldt-button--quiet',
    items = [],
    children,
    side = 'bottom',
    align = 'start',
    sideOffset = 6,
    class: className,
    onSelect,
    onCheckedChange,
    onValueChange,
    onOpenChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

{#snippet label(text: string, hint?: string, icon?: Snippet)}
  {#if icon}{@render icon()}{/if}<span>{text}</span>{#if hint}<span class="ldt-menu__hint"
      >{hint}</span
    >{/if}
{/snippet}

{#snippet rows(entries: MenuEntry<T>[])}
  {#each entries as entry, index (entry.type === 'radio' ? `radio:${entry.name}` : entry.type === 'group' || entry.type === 'sub' ? `${entry.type}:${entry.label ?? index}` : entry.value)}
    {#if entry.separatorBefore}<MenuPrimitive.Separator class="ldt-menu__separator" />{/if}
    {#if entry.type === 'group'}
      <MenuPrimitive.Group class="ldt-menu__group">
        {#if entry.label}<MenuPrimitive.GroupHeading class="ldt-menu__label"
            >{entry.label}</MenuPrimitive.GroupHeading
          >{/if}
        {@render rows(entry.items)}
      </MenuPrimitive.Group>
    {:else if entry.type === 'checkbox'}
      <MenuPrimitive.CheckboxItem
        class="ldt-menu__item ldt-menu__item--check"
        checked={entry.checked}
        disabled={entry.disabled}
        closeOnSelect={false}
        onCheckedChange={(checked) => onCheckedChange?.(entry.value, checked)}
      >
        <span class="ldt-menu__indicator" aria-hidden="true"></span>{@render label(
          entry.label,
          entry.hint
        )}
      </MenuPrimitive.CheckboxItem>
    {:else if entry.type === 'radio'}
      <MenuPrimitive.RadioGroup
        class="ldt-menu__group"
        value={entry.value}
        onValueChange={(value) => onValueChange?.(entry.name, value as T)}
      >
        {#if entry.label}<MenuPrimitive.GroupHeading class="ldt-menu__label"
            >{entry.label}</MenuPrimitive.GroupHeading
          >{/if}
        {#each entry.options as option (option.value)}
          <MenuPrimitive.RadioItem
            class="ldt-menu__item ldt-menu__item--radio"
            value={option.value}
            disabled={option.disabled}
            closeOnSelect={false}
          >
            <span class="ldt-menu__indicator" aria-hidden="true"></span><span>{option.label}</span>
          </MenuPrimitive.RadioItem>
        {/each}
      </MenuPrimitive.RadioGroup>
    {:else if entry.type === 'sub'}
      <MenuPrimitive.Sub>
        <MenuPrimitive.SubTrigger
          class="ldt-menu__item ldt-menu__item--sub"
          disabled={entry.disabled}
          >{@render label(entry.label, undefined, entry.icon)}<span
            class="ldt-menu__chevron"
            aria-hidden="true"
          ></span></MenuPrimitive.SubTrigger
        >
        <MenuPrimitive.SubContent class="ldt-menu" sideOffset={2}>
          {@render rows(entry.items)}
        </MenuPrimitive.SubContent>
      </MenuPrimitive.Sub>
    {:else}
      {@const hint = entry.hint ?? entry.shortcut}
      <MenuPrimitive.Item
        class={cx('ldt-menu__item', entry.destructive && 'ldt-menu__item--danger')}
        disabled={entry.disabled}
        aria-keyshortcuts={entry.shortcut}
        onSelect={() => onSelect?.(entry.value)}
      >
        {#snippet child({ props })}
          {#if entry.href}
            <a {...props} href={entry.href}>{@render label(entry.label, hint, entry.icon)}</a>
          {:else}
            <button {...props} type="button">{@render label(entry.label, hint, entry.icon)}</button>
          {/if}
        {/snippet}
      </MenuPrimitive.Item>
    {/if}
  {/each}
{/snippet}

<MenuPrimitive.Root bind:open {onOpenChange}>
  {#if triggerChild}<MenuPrimitive.Trigger
      >{#snippet child(childProps)}{@render triggerChild(
          childProps
        )}{/snippet}</MenuPrimitive.Trigger
    >{:else if trigger}<MenuPrimitive.Trigger class={triggerClass}
      >{@render trigger()}</MenuPrimitive.Trigger
    >{/if}
  <MenuPrimitive.Portal
    ><MenuPrimitive.Content
      bind:ref
      {side}
      {align}
      {sideOffset}
      class={cx('ldt-menu', className)}
      {...rest}
      >{#if children}{@render children()}{:else if groupLabel}<MenuPrimitive.Group
          ><MenuPrimitive.GroupHeading class="ldt-menu__label"
            >{groupLabel}</MenuPrimitive.GroupHeading
          >{@render rows(items)}</MenuPrimitive.Group
        >{:else}{@render rows(items)}{/if}</MenuPrimitive.Content
    ></MenuPrimitive.Portal
  >
</MenuPrimitive.Root>
