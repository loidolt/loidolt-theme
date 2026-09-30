/** One sampled point of a drawn stroke, in CSS pixels. `pressure` runs 0–1 (pens report it). */
export interface SignaturePoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface SignatureStroke {
  points: SignaturePoint[];
  /** Line width in CSS pixels. */
  width: number;
}

/** What a `SignaturePad` produces. */
export interface SignatureValue {
  mode: 'draw' | 'type';
  /** Drawn strokes, for re-rendering or server-side checks. */
  strokes?: SignatureStroke[];
  /** The typed name, in `type` mode. */
  typedName?: string;
  /** The font family the typed name was set in. */
  font?: string;
  /** A PNG of the signature. */
  dataUrl: string;
  /** A scalable copy, in `draw` mode. */
  svg?: string;
  width: number;
  height: number;
}

export type SignatureError = 'empty' | 'too-short';

/** Total drawn length in CSS pixels — a scribble-versus-signature heuristic. */
export function strokeLength(strokes: readonly SignatureStroke[]): number {
  let total = 0;
  for (const { points } of strokes) {
    for (let index = 1; index < points.length; index++) {
      total += Math.hypot(
        points[index].x - points[index - 1].x,
        points[index].y - points[index - 1].y
      );
    }
  }
  return total;
}

const round = (value: number) => Math.round(value * 100) / 100;

/**
 * An SVG path through a stroke's points, smoothed with quadratic curves through the midpoints —
 * the same curve the canvas draws, so the SVG and PNG agree.
 */
export function strokePath(points: readonly SignaturePoint[]): string {
  if (points.length === 0) return '';
  const [first] = points;
  if (points.length === 1) return `M${round(first.x)} ${round(first.y)}h0.01`;
  let d = `M${round(first.x)} ${round(first.y)}`;
  for (let index = 1; index < points.length - 1; index++) {
    const [point, next] = [points[index], points[index + 1]];
    d += `Q${round(point.x)} ${round(point.y)} ${round((point.x + next.x) / 2)} ${round((point.y + next.y) / 2)}`;
  }
  const last = points[points.length - 1];
  return `${d}L${round(last.x)} ${round(last.y)}`;
}

/** The strokes as a standalone SVG document. */
export function strokesToSvg(
  strokes: readonly SignatureStroke[],
  { width, height, color = '#20231d' }: { width: number; height: number; color?: string }
): string {
  const paths = strokes
    .filter((stroke) => stroke.points.length)
    .map(
      (stroke) => `<path d="${strokePath(stroke.points)}" stroke-width="${round(stroke.width)}"/>`
    )
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${round(width)} ${round(height)}" width="${round(width)}" height="${round(height)}" fill="none" stroke="${color}" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}

/** Whether a signature is long enough to count, and why not if it is not. */
export function validateSignature(
  input: { mode: 'draw' | 'type'; strokes?: readonly SignatureStroke[]; typedName?: string },
  {
    minStrokeLength = 20,
    minTypedLength = 2,
  }: { minStrokeLength?: number; minTypedLength?: number } = {}
): { valid: true } | { valid: false; error: SignatureError } {
  if (input.mode === 'type') {
    const name = input.typedName?.trim() ?? '';
    if (!name) return { valid: false, error: 'empty' };
    return name.length < minTypedLength ? { valid: false, error: 'too-short' } : { valid: true };
  }
  const strokes = input.strokes ?? [];
  if (!strokes.some((stroke) => stroke.points.length)) return { valid: false, error: 'empty' };
  return strokeLength(strokes) < minStrokeLength
    ? { valid: false, error: 'too-short' }
    : { valid: true };
}
