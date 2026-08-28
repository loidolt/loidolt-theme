<script lang="ts" generics="T extends string = string">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import Marker from './Marker.svelte';
  import { cx } from '../utils.js';

  interface CommentListItem<V extends string = string> {
    id: V;
    author: string;
    /** Preformatted suffix after the author — timestamps, origins. The theme adds nothing. */
    meta?: string;
    body: string;
    /** Renders a numbered Marker when set — ties the comment to a pin on a canvas. */
    marker?: number;
  }

  interface Props extends Omit<HTMLAttributes<HTMLUListElement>, 'children'> {
    items: CommentListItem<T>[];
    /** Highlighted item; kept in view as it changes. */
    activeId?: T | null;
    /** Fired when a markered item is hovered — for syncing the matching canvas pin. */
    onItemHover?: (id: T) => void;
    /** Full row-content override. */
    item?: Snippet<[CommentListItem<T>]>;
    class?: string;
    itemClass?: string;
    ref?: HTMLUListElement | null;
  }

  let {
    items,
    activeId = $bindable(null),
    onItemHover,
    item,
    class: className,
    itemClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let rows = $state<Record<string, HTMLLIElement | null>>({});

  $effect(() => {
    if (activeId) rows[activeId]?.scrollIntoView({ block: 'nearest' });
  });
</script>

<ul bind:this={ref} class={cx('ldt-comment-list', className)} {...rest}>
  {#each items as entry (entry.id)}
    <li
      class={cx('ldt-comment', activeId === entry.id && 'ldt-comment--active', itemClass)}
      bind:this={rows[entry.id]}
      onpointerenter={entry.marker !== undefined ? () => onItemHover?.(entry.id) : undefined}
    >
      {#if item}{@render item(entry)}{:else}
        {#if entry.marker !== undefined}<Marker
            number={entry.marker}
            active={activeId === entry.id}
          />{/if}
        <div class="ldt-comment__content">
          <span class="ldt-comment__meta">{entry.author}{entry.meta ? ` ${entry.meta}` : ''}</span>
          <p class="ldt-comment__body">{entry.body}</p>
        </div>
      {/if}
    </li>
  {/each}
</ul>
