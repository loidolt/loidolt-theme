import type { ImageRegion } from '@loidolt/theme-svelte';

/**
 * A "scanned" page drawn as an inline SVG, with every block of text outlined as a region — the
 * kind of thing a review screen puts beside the recognised text. Built from one list, so the
 * outlines and the drawing cannot drift apart. No network needed.
 */
export interface PageBlock extends ImageRegion {
  /** The recognised text. */
  text: string;
  /** How the block is drawn: one line of large type, or several lines of body text. */
  kind: 'title' | 'body' | 'cell' | 'small';
}

const WIDTH = 1000;
const HEIGHT = 1400;
const MARGIN = 80;

type Confidence = 'high' | 'low' | 'unreadable';
const variantOf = { high: 'success', low: 'warning', unreadable: 'error' } as const;

const blocks: PageBlock[] = [];
const add = (
  kind: PageBlock['kind'],
  text: string,
  box: { x: number; y: number; width: number; height: number },
  confidence: Confidence = 'high'
) => {
  const id = `b${blocks.length + 1}`;
  const name = kind === 'cell' ? 'Table cell' : kind === 'title' ? 'Heading' : 'Text block';
  const note =
    confidence === 'high' ? '' : `, ${confidence === 'low' ? 'low confidence' : 'unreadable'}`;
  blocks.push({
    id,
    ...box,
    kind,
    text,
    label: `${name} ${blocks.length + 1}: ${text}${note}`,
    variant: variantOf[confidence],
  });
};

add('title', 'Workshop notes', { x: MARGIN, y: 70, width: 520, height: 64 });
add('small', 'Batch 14 · birch ply · 3 mm', { x: MARGIN, y: 150, width: 420, height: 30 });

const paragraphs: [string, Confidence][] = [
  ['Sheets were cut at 80% power and 18 mm/s.', 'high'],
  ['Two sheets warped at the corners; flatten before gluing.', 'low'],
  ['Kerf measured 0.18 mm across the whole batch.', 'high'],
  ['Engraving depth was uneven on the lake layer.', 'high'],
  ['Note smudged — re-check the order of layers 9 and 10.', 'unreadable'],
  ['Glue-up took forty minutes with clamps every 10 cm.', 'high'],
];
let top = 220;
for (const [text, confidence] of paragraphs) {
  add('body', text, { x: MARGIN, y: top, width: WIDTH - 2 * MARGIN, height: 96 }, confidence);
  top += 120;
}

const cells = [
  ['Layer', 'Sheets', 'Status'],
  ['Ridge', '4', 'Cut'],
  ['Canyon', '6', 'Cut'],
  ['Coast', '3', 'Waiting'],
];
const tableTop = top + 20;
const cellWidth = (WIDTH - 2 * MARGIN) / 3;
cells.forEach((row, rowIndex) =>
  row.forEach((text, column) =>
    add(
      'cell',
      text,
      {
        x: MARGIN + column * cellWidth + 8,
        y: tableTop + rowIndex * 60 + 8,
        width: cellWidth - 16,
        height: 44,
      },
      rowIndex === 3 && column === 2 ? 'low' : 'high'
    )
  )
);
add('small', 'Page 3 of 12', { x: WIDTH / 2 - 90, y: HEIGHT - 90, width: 180, height: 30 });

/** Grey "ink" for one block: real text for short lines, bars for the body copy. */
const draw = (block: PageBlock) => {
  const { x, y, width, height } = block;
  if (block.kind === 'title') {
    return `<text x="${x + 4}" y="${y + 50}" font-family="serif" font-size="52" fill="#2b2a26">${block.text}</text>`;
  }
  if (block.kind === 'small' || block.kind === 'cell') {
    return `<text x="${x + 6}" y="${y + height - 10}" font-family="serif" font-size="24" fill="#3b3934">${block.text}</text>`;
  }
  const lines = [0, 1, 2].map((line) => {
    const length = line === 2 ? width * 0.55 : width - (line % 2) * 40;
    return `<rect x="${x}" y="${y + 12 + line * 30}" width="${length}" height="14" rx="3" fill="#57544c"/>`;
  });
  return lines.join('');
};

const tableLines = [0, 1, 2, 3, 4]
  .map(
    (row) =>
      `<line x1="${MARGIN}" x2="${WIDTH - MARGIN}" y1="${tableTop + row * 60}" y2="${tableTop + row * 60}" stroke="#8a857a" stroke-width="2"/>`
  )
  .join('');

const svg =
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
  `<rect width="${WIDTH}" height="${HEIGHT}" fill="#f1ede3"/>` +
  `<rect x="24" y="24" width="${WIDTH - 48}" height="${HEIGHT - 48}" fill="none" stroke="#ddd6c6" stroke-width="2"/>` +
  tableLines +
  blocks.map(draw).join('') +
  `</svg>`;

export const samplePage = {
  src: 'data:image/svg+xml,' + encodeURIComponent(svg),
  width: WIDTH,
  height: HEIGHT,
  alt: 'Scanned page of workshop notes with a short table',
  blocks,
};
