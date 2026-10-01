<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import {
    buildEmbedSrc,
    parseEmbedUrl,
    resolveAspectRatio,
    type AspectRatioName,
    type EmbedProvider,
  } from '../media-utils.js';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'title'> {
    /** A YouTube or Vimeo page, share or embed URL. */
    url?: string;
    /** Or name the video directly. */
    provider?: EmbedProvider;
    videoId?: string;
    /** Required: names the iframe and the play button. */
    title: string;
    /**
     * Still shown before the player loads. None is fetched from the provider by default — that
     * request alone would tell them someone opened the page.
     */
    poster?: string;
    /** No-tracking hosts: `youtube-nocookie.com`, Vimeo's `dnt=1`. */
    privacy?: boolean;
    /** Start offset in seconds. Read from the URL when it carries one. */
    start?: number;
    /**
     * Load the provider's player straight away. By default a local facade stands in until the
     * user presses play, so no third-party request happens before they choose to watch.
     */
    eager?: boolean;
    ratio?: AspectRatioName | number | string;
    playLabel?: (title: string) => string;
    /** Shown when the URL is not a recognised YouTube or Vimeo link. */
    unsupportedText?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    url,
    provider,
    videoId,
    title,
    poster,
    privacy = true,
    start,
    eager = false,
    ratio = 'video',
    playLabel = (name) => `Play ${name}`,
    unsupportedText = 'This video link is not supported.',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const parsed = $derived(
    provider && videoId ? { provider, videoId, start: undefined } : url ? parseEmbedUrl(url) : null
  );
  let activated = $state(false);
  const loaded = $derived(eager || activated);
  const src = $derived(
    parsed &&
      buildEmbedSrc(parsed.provider, parsed.videoId, {
        privacy,
        autoplay: activated,
        start: start ?? parsed.start,
      })
  );
  let frame = $state<HTMLIFrameElement | null>(null);

  function activate() {
    activated = true;
    // Keep keyboard users where the button was: on the player that replaced it.
    queueMicrotask(() => frame?.focus());
  }
</script>

<div
  bind:this={ref}
  class={cx('ldt-media-embed', className)}
  style:--ldt-aspect-ratio={resolveAspectRatio(ratio)}
  {...rest}
>
  {#if !parsed}
    <p class="ldt-media-embed__unsupported">{unsupportedText}</p>
  {:else if loaded}
    <iframe
      bind:this={frame}
      class="ldt-media-embed__frame"
      {src}
      {title}
      loading="lazy"
      allow="autoplay; encrypted-media; fullscreen; picture-in-picture; clipboard-write"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  {:else}
    <button
      type="button"
      class="ldt-media-embed__facade"
      style:background-image={poster ? `url("${poster}")` : undefined}
      aria-label={playLabel(title)}
      onclick={activate}
    >
      <span class="ldt-media-embed__play" aria-hidden="true">
        <svg viewBox="0 0 16 16" width="22" height="22" focusable="false"
          ><path d="M4 2.5v11l9-5.5z" fill="currentColor" /></svg
        >
      </span>
      <span class="ldt-media-embed__title" aria-hidden="true">{title}</span>
    </button>
  {/if}
</div>
