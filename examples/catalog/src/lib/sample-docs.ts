/** Demo content for the docs pages: a short guide that uses every markdown feature. */
export const guide = `---
title: Cutting your first job
description: From an uploaded file to a finished part, in five steps.
eyebrow: Guide
---
# Cutting your first job

This guide walks through a job from upload to pick-up. It assumes the machine is set up and
calibrated — see [Calibration](#calibration) if not.

## Prepare the file

Export your drawing as SVG with **outlined text** and strokes at 0.01 mm. Anything thicker is
engraved rather than cut.[^strokes]

\`\`\`ts title="export.ts"
// Outline text so the machine sees paths, not fonts.
export function prepare(svg: SVGSVGElement): SVGSVGElement {
  for (const text of svg.querySelectorAll('text')) outline(text);
  return svg;
}
\`\`\`

:::tip Save a template
Keep a template with the bed size and a safe margin already drawn in.
:::

## Choose a material

| Material  | Thickness | Speed (mm/s) | Power |
| --------- | --------: | -----------: | ----: |
| Birch ply |      3 mm |           18 |   70% |
| Cork      |      2 mm |           40 |   35% |
| Acrylic   |      3 mm |           12 |   80% |

Kerf
: The width of material the beam removes — about 0.15 mm on birch.

Focus
: The height at which the beam is narrowest. Set it with the gauge, not by eye.

> [!WARNING]
> Never cut PVC or vinyl: the fumes are toxic and corrode the machine.

## Run the job

1. Place the sheet against the rear fence.
2. Frame the job to check it fits.
3. Close the lid and start.

\`\`\`mermaid
graph LR
  Upload --> Prepare --> Frame --> Cut --> Collect
\`\`\`

### Before you leave

- [x] Extraction running
- [x] Lid closed
- [ ] Offcuts sorted for reuse

## Calibration

Run the calibration card monthly, and whenever you change the lens.

[^strokes]: Some drawing programs round hairlines up; check the exported file, not the drawing.
`;

/** A short excerpt, for the plain Markdown demo. */
export const excerpt = `## Kerf, explained

The beam removes a thin line of material — the **kerf**. For parts that fit together, draw
slots \`kerf / 2\` narrower on each side.

:::note
Kerf varies with material and focus. Cut a test comb first.
:::

- [x] Measured on birch ply
- [ ] Measured on acrylic
`;
