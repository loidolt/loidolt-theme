<script lang="ts">
  import type { MediaPlayer } from '../../media-player.svelte.js';
  import { formatDuration, formatDurationSpoken } from '../../media-utils.js';
  import type { MediaPlayerLabels } from './labels.js';

  /*
   * The control bar shared by VideoPlayer and AudioPlayer. Every control is a native element —
   * buttons, a range input, a select — so keyboard and screen-reader behaviour come from the
   * platform rather than being re-implemented.
   */
  interface Props {
    player: MediaPlayer;
    labels: MediaPlayerLabels;
    video?: boolean;
    /** What fullscreen should cover, so the controls come along. */
    container?: HTMLElement | null;
  }

  let { player, labels, video = false, container = null }: Props = $props();

  const rates = [0.5, 0.75, 1, 1.25, 1.5, 2];
  const live = $derived(player.duration === Infinity);
  const known = $derived(Number.isFinite(player.duration));
  const bufferedEnd = $derived(
    known && player.duration > 0
      ? Math.max(0, ...player.buffered.map(([, end]) => end)) / player.duration
      : 0
  );
</script>

<div class="ldt-media-controls">
  <button
    type="button"
    class="ldt-media-controls__button"
    aria-label={player.playing ? labels.pause : labels.play}
    onclick={() => player.toggle()}
  >
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">
      {#if player.playing}<path d="M4 3h3v10H4zM9 3h3v10H9z" fill="currentColor" />{:else}<path
          d="M4 2.5v11l9-5.5z"
          fill="currentColor"
        />{/if}
    </svg>
  </button>

  {#if !live}
    <div class="ldt-media-controls__scrubber" style:--ldt-media-buffered={bufferedEnd}>
      <input
        type="range"
        class="ldt-media-controls__range"
        min="0"
        max={known ? player.duration : 0}
        step="0.1"
        value={player.currentTime}
        disabled={!known}
        aria-label={labels.seek}
        aria-valuetext={labels.position(
          formatDurationSpoken(player.currentTime),
          formatDurationSpoken(known ? player.duration : 0)
        )}
        oninput={(event) => player.seek(Number(event.currentTarget.value))}
      />
    </div>
  {/if}
  <span class="ldt-media-controls__time" aria-hidden="true">
    {formatDuration(player.currentTime)}{#if known}&nbsp;/ {formatDuration(player.duration)}{/if}
  </span>

  <button
    type="button"
    class="ldt-media-controls__button"
    aria-label={player.muted ? labels.unmute : labels.mute}
    onclick={() => player.toggleMute()}
  >
    <svg
      viewBox="0 0 16 16"
      width="16"
      height="16"
      aria-hidden="true"
      focusable="false"
      fill="none"
      stroke="currentColor"
      stroke-width="1.4"
      ><path
        d="M2 6h3l4-3v10L5 10H2z"
        fill="currentColor"
        stroke="none"
      />{#if player.muted || player.volume === 0}<path d="m11 6 4 4m0-4-4 4" />{:else}<path
          d="M11 5.5a3.5 3.5 0 0 1 0 5M12.8 3.5a6 6 0 0 1 0 9"
        />{/if}</svg
    >
  </button>
  <input
    type="range"
    class="ldt-media-controls__range ldt-media-controls__volume"
    min="0"
    max="1"
    step="0.05"
    value={player.muted ? 0 : player.volume}
    aria-label={labels.volume}
    aria-valuetext={`${Math.round((player.muted ? 0 : player.volume) * 100)}%`}
    oninput={(event) => player.setVolume(Number(event.currentTarget.value))}
  />

  <select
    class="ldt-media-controls__speed"
    aria-label={labels.speed}
    value={String(player.rate)}
    onchange={(event) => player.setRate(Number(event.currentTarget.value))}
  >
    {#each rates as rate (rate)}<option value={String(rate)}>{rate}×</option>{/each}
  </select>

  {#if player.tracks.length}
    <button
      type="button"
      class="ldt-media-controls__button ldt-media-controls__text"
      aria-label={labels.captions}
      aria-pressed={player.activeTrack !== null}
      onclick={() => player.selectTrack(player.activeTrack === null ? 0 : null)}>CC</button
    >
  {/if}

  {#if video && player.canPictureInPicture}
    <button
      type="button"
      class="ldt-media-controls__button"
      aria-label={labels.pictureInPicture}
      aria-pressed={player.pictureInPicture}
      onclick={() => player.togglePictureInPicture()}
    >
      <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false"
        ><path d="M1.5 3h13v10h-13z" fill="none" stroke="currentColor" stroke-width="1.3" /><path
          d="M8 8h5v4H8z"
          fill="currentColor"
        /></svg
      >
    </button>
  {/if}

  {#if video}
    <button
      type="button"
      class="ldt-media-controls__button"
      aria-label={player.fullscreen ? labels.exitFullscreen : labels.fullscreen}
      onclick={() => player.toggleFullscreen(container)}
    >
      <svg
        viewBox="0 0 16 16"
        width="16"
        height="16"
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        >{#if player.fullscreen}<path d="M6 2v4H2M10 2v4h4M6 14v-4H2M10 14v-4h4" />{:else}<path
            d="M2 6V2h4M14 6V2h-4M2 10v4h4M14 10v4h-4"
          />{/if}</svg
      >
    </button>
  {/if}
</div>
