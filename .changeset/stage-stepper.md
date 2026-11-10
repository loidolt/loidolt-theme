---
'@loidolt/theme-svelte': minor
'@loidolt/theme-styles': minor
---

New `StageStepper`: an ordered run of named steps, each `pending`, `running`, `done`, `skipped` or `failed`, for showing where a job's pipeline stands. Pass `steps: { id, label, state, progress?, description? }[]` and change a step's `state` to move the run along.

- It renders an `<ol>`, and every step's state is read in words (`stateLabels` translates them), so colour and glyph never carry it alone. The first running step gets `aria-current="step"` and a turning activity ring that holds still under reduced motion.
- `progress` uses `Progress`'s 0 to 100 scale and draws a small bar under the step, green once it is done and red when it failed part-way.
- State changes are spoken through a polite live region; turn it off with `announce={false}` or reword it with `formatAnnouncement`.
- `orientation="horizontal"` (the default) falls back to a column when its container is narrower than 36rem; `orientation="vertical"` is always a column.
- `onSelect` turns each label into a button, for opening a step's details.
