<script lang="ts" generics="T extends string = string">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import type { TabsRootProps } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { NavItem, Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<
    TabsRootProps,
    'value' | 'onValueChange' | 'orientation' | 'children' | 'child' | 'class' | 'ref'
  > {
    /** Defaults to the first tab, so a panel is always rendered. */
    value?: T;
    tabs: NavItem<T>[];
    /** Accessible name of the tab list. */
    label?: string;
    orientation?: Orientation;
    children: Snippet<[{ value: T }]>;
    class?: string;
    listClass?: string;
    contentClass?: string;
    onValueChange?: (value: T) => void;
    ref?: HTMLElement | null;
  }

  let {
    tabs,
    // Defaulted at destructure time (not in an effect) so SSR output and the first client
    // frame already agree with what a parent binding observes.
    value = $bindable(tabs[0]?.value),
    label,
    orientation = 'horizontal',
    children,
    class: className,
    listClass,
    contentClass,
    onValueChange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // Falls back to the first tab when `value` points at a tab that no longer exists,
  // so removing the selected tab cannot blank every panel.
  const active = $derived(
    value !== undefined && tabs.some((tab) => tab.value === value) ? value : tabs[0]?.value
  );

  // Keep the public binding honest when a dynamic collection removes the selected tab. Effects
  // do not run during SSR, so the server render remains side-effect free while the client and its
  // parent converge on the fallback that is already being displayed.
  $effect(() => {
    if (active !== undefined && value !== active) {
      value = active;
      onValueChange?.(active);
    }
  });
</script>

<TabsPrimitive.Root
  bind:ref
  value={active}
  onValueChange={(next) => {
    value = next as T;
    onValueChange?.(next as T);
  }}
  {orientation}
  class={cx('ldt-tabs', className)}
  {...rest}
>
  <TabsPrimitive.List class={cx('ldt-tabs__list', listClass)} aria-label={label}
    >{#each tabs as tab (tab.value)}<TabsPrimitive.Trigger
        class="ldt-tabs__trigger"
        value={tab.value}
        disabled={tab.disabled}>{tab.label}</TabsPrimitive.Trigger
      >{/each}</TabsPrimitive.List
  >
  {#each tabs as tab (tab.value)}<TabsPrimitive.Content
      class={cx('ldt-tabs__content', contentClass)}
      value={tab.value}>{@render children({ value: tab.value })}</TabsPrimitive.Content
    >{/each}
</TabsPrimitive.Root>
