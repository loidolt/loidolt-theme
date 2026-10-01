/**
 * Runs a teardown step that may find the map already gone. When a `MapView` unmounts, its map
 * can be removed before its children clean up, and MapLibre throws on a removed map.
 */
export function safely(step: () => void): void {
  try {
    step();
  } catch {
    /* the map was removed first; there is nothing left to undo */
  }
}
