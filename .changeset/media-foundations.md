---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add media: `VideoPlayer`, `AudioPlayer`, `MediaEmbed` and `AspectRatio`, with upgrades to
`Thumbnail`.

- **Players:** controls in this system's language on the inverse surface, all built from native
  elements.
  - The seek bar speaks positions as words.
  - Shortcuts: Space/K play, arrows seek and change volume, M mutes, F goes full screen,
    C toggles captions.
  - Captions, speed, picture-in-picture and full screen.
- **HLS:** plays natively in Safari, and elsewhere through hls.js, now an **optional** peer
  dependency registered with `setHlsLoader()`.
- **`MediaEmbed`:** YouTube and Vimeo behind a click-to-load facade using their no-tracking
  hosts. It fetches no provider thumbnail unless you pass one. Unlike classic-theme, it puts
  Vimeo's start time in the URL fragment where Vimeo reads it.
- **Engines:** `createMediaPlayer()`, `createHlsSource()` and `createMediaZoom()` for your own
  media UI, plus `formatDuration`, `formatDurationSpoken`, `parseEmbedUrl`, `buildEmbedSrc`,
  `inferMediaKind` and related helpers.
- **`Thumbnail`:** takes named `ratio`s, `srcset`/`sizes`, `loading`, a `fallback` for failed
  images and an `overlay`. It shimmers while loading and reports `data-status`.
