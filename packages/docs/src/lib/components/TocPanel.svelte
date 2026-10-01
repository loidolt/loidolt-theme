<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { Drawer, cx } from '@loidolt/theme-svelte';
  import type { TocItem } from '../core/types.js';
  import TableOfContents from './TableOfContents.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    items: TocItem[];
    title?: string;
    /** Where the headings are; see `TableOfContents`. */
    container?: HTMLElement | null;
    /** The heading being read. Bindable. */
    activeId?: string | null;
    offset?: number;
    /** On narrow screens the contents open from a button with this label. */
    openLabel?: string;
    closeLabel?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    items,
    title = 'On this page',
    container = null,
    activeId = $bindable(null),
    offset,
    openLabel = 'On this page',
    closeLabel,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let open = $state(false);
</script>

<!-- Both forms render on the server; CSS picks one by width, so nothing jumps on hydration. -->
<div bind:this={ref} class={cx('ldt-toc-panel', className)} {...rest}>
  <div class="ldt-toc-panel__wide">
    <TableOfContents {items} {title} {container} {offset} bind:activeId />
  </div>
  <div class="ldt-toc-panel__compact">
    <Drawer bind:open {title} side="right" triggerVariant="quiet" triggerSize="sm" {closeLabel}>
      {#snippet trigger()}{openLabel}{/snippet}
      <TableOfContents
        {items}
        {title}
        {container}
        {offset}
        bind:activeId
        onNavigate={() => (open = false)}
      />
    </Drawer>
  </div>
</div>
