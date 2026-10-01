<script lang="ts">
  import { untrack } from 'svelte';
  import type { IControl } from 'maplibre-gl';
  import { loadDeck, type DeckOverlayInstance } from '../deck.js';
  import { requireMapContext } from '../internal/context.js';
  import { safely } from '../internal/safely.js';

  interface Props {
    /** deck.gl layers, built by you (`new ScatterplotLayer({…})`). Replace the array to update. */
    layers: unknown[];
    /**
     * Draw deck.gl layers in among the map's own, sharing its depth, rather than on a canvas
     * above it. Off by default: interleaving reaches into MapLibre's renderer, so it needs a
     * deck.gl release that supports your MapLibre major (deck.gl 9.4 does not yet support
     * MapLibre 6's).
     */
    interleaved?: boolean;
    /** Anything else `MapboxOverlay` takes — `getTooltip`, `pickingRadius`, `effects`… */
    overlayProps?: Record<string, unknown>;
    /** deck.gl could not be loaded: nothing is drawn. Register it with `setDeckLoader`. */
    onUnavailable?: () => void;
  }

  let { layers, interleaved = false, overlayProps = {}, onUnavailable }: Props = $props();

  const context = requireMapContext('DeckOverlay');
  let overlay = $state.raw<DeckOverlayInstance | null>(null);

  $effect(() => {
    const map = context.map;
    if (!map) return;
    let disposed = false;
    let created: DeckOverlayInstance | null = null;
    void loadDeck().then((deck) => {
      if (disposed) return;
      if (!deck) {
        untrack(() => onUnavailable?.());
        return;
      }
      created = new deck.MapboxOverlay(untrack(() => ({ ...overlayProps, interleaved, layers })));
      map.addControl(created as unknown as IControl);
      overlay = created;
    });
    return () => {
      disposed = true;
      overlay = null;
      if (created) {
        const done = created;
        safely(() => map.removeControl(done as unknown as IControl));
        done.finalize?.();
      }
    };
  });

  $effect(() => {
    overlay?.setProps({ ...overlayProps, layers });
  });
</script>
