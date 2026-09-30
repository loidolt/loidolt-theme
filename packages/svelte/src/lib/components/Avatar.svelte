<script lang="ts">
  import { Avatar as AvatarPrimitive, type AvatarRootProps } from 'bits-ui';
  import type { Snippet } from 'svelte';
  import type { ControlSize } from '../types.js';
  import { cx } from '../utils.js';

  type LoadingStatus = 'loading' | 'loaded' | 'error';

  type Props = Omit<
    AvatarRootProps,
    'child' | 'children' | 'loadingStatus' | 'onLoadingStatusChange' | 'ref'
  > & {
    /** Image URL. Without one, or while it loads or after it fails, the fallback shows. */
    src?: string;
    /**
     * Who this is. Names the avatar for assistive tech and supplies the fallback initials. Leave
     * both `name` and `alt` unset when adjacent text already names the person — the avatar is
     * then decorative.
     */
    name?: string;
    /** Accessible name when it should differ from `name`. */
    alt?: string;
    /** Fallback text. Defaults to the first letters of the first and last word of `name`. */
    initials?: string;
    /** Custom fallback, e.g. a generic person glyph. Replaces the initials. */
    fallback?: Snippet;
    /** Matches the control heights, so an avatar sits level with buttons of the same size. */
    size?: ControlSize;
    /** Milliseconds before the fallback appears, so a fast image never flashes initials first. */
    delayMs?: number;
    loadingStatus?: LoadingStatus;
    onLoadingStatusChange?: (status: LoadingStatus) => void;
    class?: string;
    ref?: HTMLElement | null;
  };

  let {
    src,
    name,
    alt,
    initials,
    fallback,
    size = 'md',
    delayMs = 0,
    loadingStatus = $bindable('loading'),
    onLoadingStatusChange,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const label = $derived(alt ?? name);
  const letters = $derived(
    initials ??
      (name ?? '')
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .filter((_, index, words) => index === 0 || index === words.length - 1)
        .map((word) => word[0])
        .join('')
        .toLocaleUpperCase()
  );
</script>

<!--
  One accessible name on the root, whichever of image or initials is showing: otherwise the
  announcement would change when the image finished loading, or vanish when it failed.
-->
<AvatarPrimitive.Root
  bind:ref
  bind:loadingStatus
  {delayMs}
  {onLoadingStatusChange}
  class={cx('ldt-avatar', size !== 'md' && `ldt-avatar--${size}`, className)}
  role={label ? 'img' : undefined}
  aria-label={label}
  aria-hidden={label ? undefined : 'true'}
  {...rest}
>
  {#if src}<AvatarPrimitive.Image class="ldt-avatar__image" {src} alt="" />{/if}
  <AvatarPrimitive.Fallback class="ldt-avatar__fallback" aria-hidden="true">
    {#if fallback}{@render fallback()}{:else}{letters}{/if}
  </AvatarPrimitive.Fallback>
</AvatarPrimitive.Root>
