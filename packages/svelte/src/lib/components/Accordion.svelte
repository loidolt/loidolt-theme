<script lang="ts" generics="T extends string = string">
  import { Accordion as AccordionPrimitive } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Disclosure, HeadingLevel } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    items: Disclosure<T>[];
    /** Narrowed from the DOM attribute: the Bits root this spreads onto rejects `null`. */
    id?: string;
    /** Lets more than one panel stay open. `value` is then an array. */
    multiple?: boolean;
    /** Open panel, or panels when `multiple`. Bindable. */
    value?: T | T[];
    /**
     * Heading level of every trigger's wrapper. Panels sit at one level below whatever heading
     * introduces the accordion, so keep this in step with the surrounding outline.
     */
    headingLevel?: HeadingLevel;
    disabled?: boolean;
    /** Panel body, rendered for each item with the item's own value. */
    children: Snippet<[{ value: T }]>;
    class?: string;
    itemClass?: string;
    contentClass?: string;
    onValueChange?: (value: T | T[]) => void;
    ref?: HTMLDivElement | null;
  }

  let {
    items,
    multiple = false,
    value = $bindable(),
    headingLevel = 3,
    disabled = false,
    children,
    class: className,
    itemClass,
    contentClass,
    onValueChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // Bits discriminates single/multiple at the type level with a different `value` shape for
  // each. The panels are identical either way, so the markup lives in one snippet and only the
  // Root differs.
  const change = (next: string | string[]) => {
    value = next as T | T[];
    onValueChange?.(next as T | T[]);
  };
</script>

{#snippet panels()}
  {#each items as item (item.value)}
    <AccordionPrimitive.Item
      value={item.value}
      disabled={item.disabled}
      class={cx('ldt-accordion__item', itemClass)}
    >
      <AccordionPrimitive.Header level={headingLevel} class="ldt-accordion__heading">
        <AccordionPrimitive.Trigger class="ldt-accordion__trigger">
          <span class="ldt-accordion__label">{item.title}</span>
          <!-- Decorative: the trigger's `aria-expanded` already carries open state. -->
          <span class="ldt-accordion__indicator" aria-hidden="true"></span>
        </AccordionPrimitive.Trigger>
      </AccordionPrimitive.Header>
      <AccordionPrimitive.Content class={cx('ldt-accordion__content', contentClass)}>
        <div class="ldt-accordion__body">{@render children({ value: item.value })}</div>
      </AccordionPrimitive.Content>
    </AccordionPrimitive.Item>
  {/each}
{/snippet}

{#if multiple}
  <AccordionPrimitive.Root
    bind:ref
    type="multiple"
    value={(value ?? []) as string[]}
    onValueChange={change}
    {disabled}
    class={cx('ldt-accordion', className)}
    {...rest}
  >
    {@render panels()}
  </AccordionPrimitive.Root>
{:else}
  <AccordionPrimitive.Root
    bind:ref
    type="single"
    value={(value ?? '') as string}
    onValueChange={change}
    {disabled}
    class={cx('ldt-accordion', className)}
    {...rest}
  >
    {@render panels()}
  </AccordionPrimitive.Root>
{/if}
