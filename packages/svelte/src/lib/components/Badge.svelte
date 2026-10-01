<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import type { BadgeSize, BadgeVariant } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: BadgeSize;
    /** A leading dot in the badge's colour — a status marker that still reads in greyscale. */
    dot?: boolean;
    /** A number to show instead of `children`, e.g. unread items. Above `max` it reads `99+`. */
    count?: number;
    max?: number;
    /**
     * Visually hidden context read after the visible text, so "3" is heard as "3 unread
     * messages". Needed whenever the number or word alone does not say what it counts.
     */
    label?: string;
    /** Announce changes (`role="status"`) — for a count that updates while the user watches. */
    live?: boolean;
    class?: string;
    children?: Snippet;
    ref?: HTMLSpanElement | null;
  }

  let {
    variant = 'default',
    size = 'inline',
    dot = false,
    count,
    max = 99,
    label,
    live = false,
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const shown = $derived(count === undefined ? undefined : count > max ? `${max}+` : String(count));
</script>

<span
  bind:this={ref}
  class={cx(
    'ldt-badge',
    variant !== 'default' && `ldt-badge--${variant}`,
    size !== 'inline' && `ldt-badge--${size}`,
    className
  )}
  role={live ? 'status' : undefined}
  aria-live={live ? 'polite' : undefined}
  aria-atomic={live ? 'true' : undefined}
  {...rest}
  >{#if dot}<span class="ldt-badge__dot" aria-hidden="true"
    ></span>{/if}{#if shown !== undefined}{shown}{:else if children}{@render children()}{/if}{#if label}<span
      class="ldt-sr-only">{` ${label}`}</span
    >{/if}</span
>
