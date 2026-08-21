<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
  import type { ActionVariant, ControlSize } from '../types.js';
  import { cx } from '../utils.js';

  interface CommonProps {
    variant?: ActionVariant;
    size?: ControlSize;
    disabled?: boolean;
    loading?: boolean;
    /** Visible text swapped in while loading. */
    loadingText?: string;
    /** Announced while loading when there is no visible `loadingText`. */
    loadingLabel?: string;
    class?: string;
    children: Snippet;
    ref?: HTMLButtonElement | HTMLAnchorElement | null;
  }

  // Discriminated on `href`: with it the component renders an `<a>` and accepts anchor
  // attributes; without it, a `<button>` and button attributes. Button-only attributes
  // (`formaction`, `type`, …) on an anchor are a type error instead of silent junk.
  type Props = CommonProps &
    (
      | (Omit<HTMLAnchorAttributes, 'class' | 'type'> & {
          /** Renders an `<a>` styled as a button. */
          href: string;
          type?: never;
        })
      | (Omit<HTMLButtonAttributes, 'class'> & { href?: never })
    );

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
    cx(
      'ldt-button',
      variant !== 'default' && `ldt-button--${variant}`,
      size !== 'md' && `ldt-button--${size}`,
      className
    )
  );
  const inert = $derived(disabled || loading);

  function handleClick(event: MouseEvent) {
    if (inert) {
      event.preventDefault();
      return;
    }
    // The union collapses the handler's currentTarget; the branch that rendered us fixes it.
    (onclick as ((event: MouseEvent) => void) | undefined)?.(event);
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
    {...rest as HTMLAnchorAttributes}
    onclick={handleClick}>{@render content()}</a
  >
{:else}
  <!--
    `loading` uses `aria-disabled` + a click guard instead of native `disabled`: disabling
    the control mid-interaction would drop keyboard focus to <body> and can hide the busy
    announcement from assistive tech. Explicit `disabled` keeps native semantics.
  -->
  <button
    bind:this={ref}
    {type}
    class={classes}
    disabled={disabled || undefined}
    aria-disabled={loading && !disabled ? true : undefined}
    aria-busy={loading || undefined}
    {...rest as HTMLButtonAttributes}
    onclick={handleClick}>{@render content()}</button
  >
{/if}
