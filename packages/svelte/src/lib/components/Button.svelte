<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import type { ActionVariant, ControlSize } from '../types.js';
  import { cx } from '../utils.js';

  type Props = HTMLButtonAttributes &
    HTMLAnchorAttributes & {
      variant?: ActionVariant;
      size?: ControlSize;
      /** Renders an `<a>` styled as a button. */
      href?: string;
      disabled?: boolean;
      loading?: boolean;
      /** Visible text swapped in while loading. */
      loadingText?: string;
      /** Announced while loading when there is no visible `loadingText`. */
      loadingLabel?: string;
      class?: string;
      children: Snippet;
      ref?: HTMLButtonElement | HTMLAnchorElement | null;
    };

  let {
    variant = 'default',
    size = 'md',
    type = 'button',
    href,
    disabled = false,
    loading = false,
    loadingText,
    loadingLabel = 'Loading',
    class: className,
    children,
    onclick,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const classes = $derived(
    cx('ldt-button', `ldt-button--${variant}`, size !== 'md' && `ldt-button--${size}`, className)
  );
  const inert = $derived(disabled || loading);

  function handleClick(event: MouseEvent) {
    if (inert) {
      event.preventDefault();
      return;
    }
    onclick?.(event as MouseEvent & { currentTarget: EventTarget & HTMLButtonElement });
  }
</script>

{#snippet content()}
  {#if loading}<span class="ldt-spinner" aria-hidden="true"></span>{/if}
  {#if loading && loadingText}{loadingText}{:else}{@render children()}{/if}
  <!--
    Persistently mounted: a live region only announces content that changes *after* it is in the
    DOM, so mounting it alongside the message would be silent in most screen readers.
  -->
  <span class="ldt-sr-only" role="status">{loading && !loadingText ? loadingLabel : ''}</span>
{/snippet}

{#if href}
  <a
    bind:this={ref}
    href={inert ? undefined : href}
    class={classes}
    aria-disabled={inert || undefined}
    aria-busy={loading || undefined}
    tabindex={inert ? -1 : undefined}
    {...rest}
    onclick={handleClick}>{@render content()}</a
  >
{:else}
  <button
    bind:this={ref}
    {type}
    class={classes}
    disabled={inert}
    aria-busy={loading || undefined}
    {...rest}
    onclick={handleClick}>{@render content()}</button
  >
{/if}
