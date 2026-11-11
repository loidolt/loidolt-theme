---
'@loidolt/theme-styles': patch
'@loidolt/theme-svelte': patch
'@loidolt/theme-charts': patch
'@loidolt/theme-docs': patch
---

More phone polish. Topbar's actions sit beside the brand while they fit on a compact screen, instead of always taking a row of their own. On a phone, Slider and Progress put their readouts above the track, so the tracks keep the full width and line up; ImageViewer's fit buttons share out their row, and its zoom buttons are boxed; MarkdownPage's previous and next cards stack full width; and an empty chart's message no longer takes the chart's full height. Switch labels take the same face and size as checkbox and radio labels; SwatchGroup's swatches sit clear of their legend; in a CommentList with numbered comments an unnumbered reply lines up with their text; task-list boxes match their text; and footnote back-links and heading anchors take a 44px press on touch. HeatmapChart names the ends of its scale and sets cell values at 11px; TreemapChart names the first stop of its breadcrumb after the chart's title, which also gives it room to be pressed; a scrolling legend's page arrows are larger; and SankeyChart leaves room for the last node's label. CodeSnippet shows the language at the left of its copy bar when there is no filename.
