<script lang="ts" generics="T extends string = string">
  import { DropdownMenu as MenuPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { DropdownMenuContentProps } from 'bits-ui';
  import type { Alignment, MenuItem, Placement, TriggerChildProps } from '../types.js';
  import { cx } from '../utils.js';

  type Props = Omit<DropdownMenuContentProps, 'children' | 'class' | 'child'> & {
    open?: boolean;
    /** Heading rendered above `items`, associated with them via a menu group. */
    groupLabel?: string;
    trigger?: Snippet;
    /** Full control of the trigger element — receives the props Bits needs on it. */
    triggerChild?: Snippet<[TriggerChildProps]>;
    triggerClass?: string;
    /** Declarative rows. Ignored when `children` is provided. */
    items?: MenuItem<T>[];
    /** Escape hatch: compose the menu body yourself from the re-exported primitives. */
    children?: Snippet;
    side?: Placement;
    align?: Alignment;
    sideOffset?: number;
    /** `class` lands on the portaled Content element. */
    class?: string;
    onSelect?: (value: T) => void;
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
    onOpenChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

{#snippet rows()}
  {#each items as item (item.value)}
    {#if item.separatorBefore}<MenuPrimitive.Separator class="ldt-menu__separator" />{/if}
    <MenuPrimitive.Item
      class="ldt-menu__item"
      disabled={item.disabled}
      onSelect={() => onSelect?.(item.value)}
    >
      {#snippet child({ props })}
        {#if item.href}
          <a {...props} href={item.href}
            >{#if item.icon}{@render item.icon()}{/if}<span>{item.label}</span>{#if item.hint}<span
                aria-hidden="true">{item.hint}</span
              >{/if}</a
          >
        {:else}
          <button {...props} type="button"
            >{#if item.icon}{@render item.icon()}{/if}<span>{item.label}</span>{#if item.hint}<span
                aria-hidden="true">{item.hint}</span
              >{/if}</button
          >
        {/if}
      {/snippet}
    </MenuPrimitive.Item>
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
          >{@render rows()}</MenuPrimitive.Group
        >{:else}{@render rows()}{/if}</MenuPrimitive.Content
    ></MenuPrimitive.Portal
  >
</MenuPrimitive.Root>
