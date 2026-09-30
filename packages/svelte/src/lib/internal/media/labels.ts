/** Every string the media players show or announce. */
export interface MediaPlayerLabels {
  play: string;
  pause: string;
  mute: string;
  unmute: string;
  seek: string;
  volume: string;
  speed: string;
  captions: string;
  pictureInPicture: string;
  fullscreen: string;
  exitFullscreen: string;
  /** Shown when the media cannot be played. */
  error: string;
  /** Spoken position, e.g. "1 minute 5 seconds of 4 minutes". */
  position: (current: string, total: string) => string;
}

export const defaultMediaLabels: MediaPlayerLabels = {
  play: 'Play',
  pause: 'Pause',
  mute: 'Mute',
  unmute: 'Unmute',
  seek: 'Seek',
  volume: 'Volume',
  speed: 'Playback speed',
  captions: 'Captions',
  pictureInPicture: 'Picture in picture',
  fullscreen: 'Full screen',
  exitFullscreen: 'Exit full screen',
  error: 'This media could not be played.',
  position: (current, total) => `${current} of ${total}`,
};
