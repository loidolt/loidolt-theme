---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

Add `MediaGrid`, `Lightbox` and `MediaCarousel` for collections of images, video, audio and
embeds.

- **`MediaGrid`:** one tab stop with arrow-key movement. Tiles name their media kind, the grid
  can be laid out as masonry, and it opens a `Lightbox` on the pressed item.
- **`Lightbox`:** a full-screen dialog.
  - Keyboard and swipe navigation.
  - Zoom and pan from `createMediaZoom()`.
  - Preloads the neighbouring items, and has a filmstrip of thumbnails.
  - Announces each move once, and offers a download link for images.
- **`MediaCarousel`:** follows the WAI-ARIA carousel pattern.
  - Slides are named groups. The live region is polite when the user drives it and off while it
    autoplays.
  - Autoplay pauses on hover and focus, and has a visible pause button.
  - It starts paused under `prefers-reduced-motion`.
