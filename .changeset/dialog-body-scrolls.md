---
'@loidolt/theme-styles': patch
---

Keep a dialog's actions in reach on short screens. `.ldt-dialog` is now a flex column whose body alone shrinks and scrolls; before, a tall body pushed the footer (and its Save or Confirm button) below the dialog's max height, where `overflow: hidden` clipped it out of reach. The `--full` size and an `AlertDialog` without content (no body) lay out the same way.
