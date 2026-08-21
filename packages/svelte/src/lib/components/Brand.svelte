<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  type Props = HTMLAnchorAttributes &
    HTMLAttributes<HTMLSpanElement> & {
      name: string;
      /** Secondary line, e.g. an environment or version marker. */
      meta?: string;
      /** Renders an `<a>` instead of a `<span>`. */
      href?: string;
      mark?: Snippet;
      class?: string;
      ref?: HTMLElement | null;
    };

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
{#if href}<a bind:this={ref} {href} class={cx('ldt-brand', className)} {...rest}
    >{@render content()}</a
  >{:else}<span bind:this={ref} class={cx('ldt-brand', className)} {...rest}
    >{@render content()}</span
  >{/if}
