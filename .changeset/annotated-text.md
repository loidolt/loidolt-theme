---
'@loidolt/theme-styles': minor
'@loidolt/theme-svelte': minor
---

New `AnnotatedText`: a plain-text editor whose marked ranges stay on their characters while the user edits, for review work such as flagging low-confidence words or automatic corrections. Pass `bind:value` and `bind:marks` (`TextMark`s: `id`, `start`, `end` as UTF-16 offsets with an exclusive end, a status `variant` and a `label`). It is a real `<textarea>` over a mirror that draws the marks, styled like a boxed `Textarea`, so native undo, spellcheck, IME input, mobile selection and `Field` labelling keep working.

Edits before a mark shift it, edits inside resize it, and a mark with no characters left is dropped. Typing at a mark's start pushes it along; typing at its end does not extend it. `F8` and `Shift+F8` (or the optional previous/next buttons, or `next()`, `previous()` and `focusMark(id)` on the instance) select each mark in turn. Each mark shows its label as a tooltip on hover and while the caret is in it; screen readers hear it through `aria-describedby` and an announcement on entering the mark, and `onMarkChange` reports it to your code.

The offset logic is exported for use without the component: `shiftMarks(marks, edit)`, `diffText(before, after, caret?)`, plus `markAt`, `nextMark`, `previousMark`, `sortMarks` and `segmentText`.
