<script lang="ts" generics="T extends string = string">
  import { Tabs as TabsPrimitive } from 'bits-ui';
  import type { TabsRootProps } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { Orientation, TabItem } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<
    TabsRootProps,
    'value' | 'onValueChange' | 'orientation' | 'children' | 'child' | 'class' | 'ref'
  > {
    /** Defaults to the first tab, so a panel is always rendered. */
    value?: T;
    tabs: TabItem<T>[];
    /** Accessible name of the tab list. */
    label?: string;
    orientation?: Orientation;
    /**
     * `line` underlines the selected tab. `rail` is an icon rail for a settings sidebar: short
     * labels under icons, the list fixed beside (or above) panels that scroll on their own.
     */
    variant?: 'line' | 'rail';
    /**
     * Every panel stays mounted, hidden while unselected, so a panel keeps its state and its
     * controls can be found while another one shows.
     */
    children: Snippet<[{ value: T }]>;
    /** Shared content above the panels, such as a filter or search; pinned while the rail's panels scroll. */
    panelHeader?: Snippet;
    class?: string;
    listClass?: string;
    contentClass?: string;
    /** The element around the panels, present in the rail variant or with a `panelHeader`. */
    panelsClass?: string;
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
    variant = 'line',
    children,
    panelHeader,
    class: className,
    listClass,
    contentClass,
    panelsClass,
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

  const wrapped = $derived(variant === 'rail' || panelHeader !== undefined);
</script>

{#snippet panels()}
  {#each tabs as tab (tab.value)}<TabsPrimitive.Content
      class={cx('ldt-tabs__content', contentClass)}
      value={tab.value}>{@render children({ value: tab.value })}</TabsPrimitive.Content
    >{/each}
{/snippet}

<TabsPrimitive.Root
  bind:ref
  value={active}
  onValueChange={(next) => {
    value = next as T;
    onValueChange?.(next as T);
  }}
  {orientation}
  data-variant={variant}
  class={cx('ldt-tabs', variant === 'rail' && 'ldt-tabs--rail', className)}
  {...rest}
>
  <TabsPrimitive.List class={cx('ldt-tabs__list', listClass)} aria-label={label}
    >{#each tabs as tab (tab.value)}<TabsPrimitive.Trigger
        class="ldt-tabs__trigger"
        value={tab.value}
        disabled={tab.disabled}
        title={tab.description}
        >{#if tab.icon}<span class="ldt-tabs__icon" aria-hidden="true">{@render tab.icon()}</span
          ><span class="ldt-tabs__label">{tab.label}</span
          >{:else}{tab.label}{/if}</TabsPrimitive.Trigger
      >{/each}</TabsPrimitive.List
  >
  {#if wrapped}
    <div class={cx('ldt-tabs__panels', panelsClass)}>
      {#if panelHeader}<div class="ldt-tabs__panel-header">{@render panelHeader()}</div>{/if}
      {@render panels()}
    </div>
  {:else}
    {@render panels()}
  {/if}
</TabsPrimitive.Root>
