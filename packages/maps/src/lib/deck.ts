/*
 * deck.gl, for large-data visualisation over the map. An optional peer this package never
 * imports itself; register it once where you use it:
 *
 *   import { setDeckLoader } from '@loidolt/theme-maps';
 *   setDeckLoader(() => import('@deck.gl/mapbox'));
 */

/** The slice of `@deck.gl/mapbox`'s `MapboxOverlay` that `DeckOverlay` uses. */
export interface DeckOverlayInstance {
  setProps(props: Record<string, unknown>): void;
  onAdd?(map: unknown): HTMLElement;
  onRemove?(map: unknown): void;
  finalize?(): void;
}

export interface DeckModule {
  MapboxOverlay: new (props: Record<string, unknown>) => DeckOverlayInstance;
}

export type DeckLoader = () => Promise<unknown> | unknown;

let registered: DeckLoader | null = null;
let cached: Promise<DeckModule | null> | null = null;

/** Registers how to load `@deck.gl/mapbox`. `null` unregisters. */
export function setDeckLoader(loader: DeckLoader | null): void {
  registered = loader;
  cached = null;
}

/**
 * Resolves `@deck.gl/mapbox` through the registered loader, else a global `deck` from a script
 * tag. Resolves `null` rather than rejecting when neither is there.
 */
export function loadDeck(): Promise<DeckModule | null> {
  cached ??= Promise.resolve()
    .then(registered ?? (() => (globalThis as { deck?: unknown }).deck))
    .then((module) =>
      typeof (module as Partial<DeckModule> | undefined)?.MapboxOverlay === 'function'
        ? (module as DeckModule)
        : null
    )
    .catch(() => null);
  return cached;
}
