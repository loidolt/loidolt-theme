---
'@loidolt/theme-maps': patch
---

Fit a `MapView` to the first `bounds` that arrive after it loads. A map created without `bounds` used to treat the first box it was given as already fitted on load, so only a second change moved the view (a route planner opening a saved route stayed put). The load handler now records a box only when it actually fits one, so the map still fits a box given at creation exactly once. Clearing `bounds` also forgets the last box, so passing the same box again fits it again. When `center`/`zoom` and `bounds` change in the same tick, the fit wins.
