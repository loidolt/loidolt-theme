<script lang="ts" generics="T extends string = string">
  import { tick, type Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { Option } from '../types.js';
  import { cx } from '../utils.js';
  import Button from './Button.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    /** One chip per filter narrowing the results, labelled the way the user would say it. */
    items: Option<T>[];
    /** Clear one filter. Remove it from `items` in response. */
    onRemove: (value: T) => void;
    /** Clear every filter; shows a trailing "Clear all" when set. */
    onClearAll?: () => void;
    label?: string;
    removeLabel?: (label: string) => string;
    clearAllLabel?: string;
    /** Notes after the chips, e.g. a filter that does not apply to this view. */
    children?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    items,
    onRemove,
    onClearAll,
    label = 'Active filters',
    removeLabel = (text) => `Remove filter ${text}`,
    clearAllLabel = 'Clear all',
    children,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  async function remove(value: T, index: number) {
    onRemove(value);
    await tick();
    // Focus stays in the group: the chip that took this one's place, else the one before it,
    // else the group itself — never dropped to <body>.
    const buttons = ref?.querySelectorAll<HTMLButtonElement>('.ldt-chip__remove') ?? [];
    (buttons[index] ?? buttons[index - 1] ?? ref)?.focus();
  }
</script>

{#if items.length || children}
  <div
    bind:this={ref}
    class={cx('ldt-filter-chips', className)}
    role="group"
    aria-label={label}
    tabindex="-1"
    {...rest}
  >
    {#if items.length}
      <ul class="ldt-filter-chips__list">
        {#each items as item, index (item.value)}
          <li class="ldt-chip">
            <span>{item.label}</span>
            <button
              type="button"
              class="ldt-chip__remove"
              aria-label={removeLabel(item.label)}
              disabled={item.disabled}
              onclick={() => remove(item.value, index)}
              ><svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"
                ><path d="m2 2 6 6M8 2 2 8" stroke="currentColor" stroke-width="1.4" /></svg
              ></button
            >
          </li>
        {/each}
      </ul>
    {/if}
    {#if children}{@render children()}{/if}
    {#if onClearAll && items.length}<Button variant="text" size="sm" onclick={onClearAll}
        >{clearAllLabel}</Button
      >{/if}
  </div>
{/if}
