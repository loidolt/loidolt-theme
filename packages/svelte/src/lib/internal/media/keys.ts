import type { MediaPlayer } from '../../media-player.svelte.js';

/**
 * The shortcuts every web player shares: Space or K plays, arrows seek and change volume, M
 * mutes, F goes full screen, C toggles captions. Keys meant for a focused control — typing in a
 * field, stepping a range, pressing a button — are left alone.
 */
export function mediaKeydown(player: MediaPlayer, container: () => HTMLElement | null) {
  return (event: KeyboardEvent) => {
    const target = event.target as HTMLElement;
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    if (target.matches('input, select, textarea')) return;
    if (target.matches('button') && (event.key === ' ' || event.key === 'Enter')) return;
    const handled = (() => {
      switch (event.key) {
        case ' ':
        case 'k':
          void player.toggle();
          return true;
        case 'ArrowLeft':
          player.seekBy(-5);
          return true;
        case 'ArrowRight':
          player.seekBy(5);
          return true;
        case 'ArrowUp':
          player.setVolume(player.volume + 0.1);
          return true;
        case 'ArrowDown':
          player.setVolume(player.volume - 0.1);
          return true;
        case 'm':
          player.toggleMute();
          return true;
        case 'f':
          void player.toggleFullscreen(container());
          return true;
        case 'c':
          if (!player.tracks.length) return false;
          player.selectTrack(player.activeTrack === null ? 0 : null);
          return true;
        default:
          return false;
      }
    })();
    if (handled) event.preventDefault();
  };
}
