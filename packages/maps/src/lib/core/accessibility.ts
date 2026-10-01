import { formatCoordinate } from './format.js';
import type { LngLat } from './types.js';

/*
 * Text for the non-visual side of a map. MapLibre's own keyboard handler does the work — the
 * canvas takes focus, arrows pan, + and − zoom — and these describe what it did.
 */

/** The keyboard controls MapLibre actually implements, for a help panel or a description. */
export const MAP_KEYS = [
  { keys: 'Arrow keys', action: 'Pan' },
  { keys: '+ or =', action: 'Zoom in' },
  { keys: '−', action: 'Zoom out' },
  { keys: 'Shift + ← or →', action: 'Rotate' },
  { keys: 'Shift + ↑ or ↓', action: 'Tilt' },
] as const;

/** One sentence naming the keys, for a map's description. */
export const describeMapKeys = () =>
  'Focus the map to move it: arrow keys pan, plus and minus zoom, Shift with the arrows rotates and tilts.';

/** Zoom as words, since "zoom 12.4" means little aloud. */
export function describeZoom(zoom: number): string {
  if (zoom < 3) return 'world';
  if (zoom < 6) return 'continent';
  if (zoom < 9) return 'region';
  if (zoom < 12) return 'city';
  if (zoom < 15) return 'neighbourhood';
  return 'street';
}

/** "Map centred on 45.52° N, 122.68° W at city level." — announced after a move. */
export function formatMoveAnnouncement(center: LngLat, zoom: number): string {
  return `Map centred on ${formatCoordinate(center, { precision: 2 })} at ${describeZoom(zoom)} level.`;
}
