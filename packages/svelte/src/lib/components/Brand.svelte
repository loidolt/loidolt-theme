<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface CommonProps {
    name: string;
    /** Secondary line, e.g. an environment or version marker. */
    meta?: string;
    mark?: Snippet;
    class?: string;
    ref?: HTMLElement | null;
  }

  // Discriminated on `href`: an `<a>` with anchor attributes, or a plain `<span>`.
  type Props = CommonProps &
    (
      | (Omit<HTMLAnchorAttributes, 'class'> & {
          /** Renders an `<a>` instead of a `<span>`. */
          href: string;
        })
      | (Omit<HTMLAttributes<HTMLSpanElement>, 'class'> & { href?: never })
    );

  let {
    name,
    meta,
    href,
    mark,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

{#snippet content()}{#if mark}{@render mark()}{/if}<strong class="ldt-brand__name">{name}</strong
  >{#if meta}<span class="ldt-brand__meta">{meta}</span>{/if}{/snippet}
<!-- TS cannot narrow the destructured `rest` by `href`, so each branch casts to its side
     of the union. The public Props type still rejects mismatched attributes. -->
{#if href}<a
    bind:this={ref}
    {href}
    class={cx('ldt-brand', className)}
    {...rest as HTMLAnchorAttributes}>{@render content()}</a
  >{:else}<span
    bind:this={ref}
    class={cx('ldt-brand', className)}
    {...rest as HTMLAttributes<HTMLSpanElement>}>{@render content()}</span
  >{/if}
