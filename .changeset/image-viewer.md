---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

New `ImageViewer`: an inline, non-modal zoomable image for a pane, such as a scanned page beside its recognised text. It zooms with + and −, pinch, Ctrl + wheel and double-click (around the pointer). It pans with the arrow keys, by dragging, or with the plain wheel once the image overflows. Fit width, Fit height and Fit whole image sit in its controls, and every label is a prop. `regions` draws rectangles given in the image's natural pixels (`{ id, x, y, width, height, label, variant? }`, with variants from the badge set). They are laid out in the same box as the image, so they stay aligned at every zoom. The regions are a keyboard listbox with one tab stop and are named by their labels. Bind `selectedRegionId` and `hoveredRegionId` to link a list beside the viewer both ways: selecting from outside pans the region into view and announces it. `onRegionClick` and `onRegionHover` report pointer use.

`createMediaZoom()` gains a content mode for this, and `Lightbox` works exactly as before. Pass `contentSize` (or call `setContentSize()`) to zoom in the content's own pixels, with scales below 1 when fitting needs them. The new methods are `fit('contain' | 'width' | 'height')`, `zoomTo(scale, point)`, `pan()` and `reveal(rect)`, and the new options are `stepFactor`, `zoomToPointer` and `wheelPan`. All of them are optional.
