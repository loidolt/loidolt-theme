<script lang="ts">
  import MapView from '../../src/lib/components/MapView.svelte';
  import MapSource from '../../src/lib/components/MapSource.svelte';
  import FillLayer from '../../src/lib/components/FillLayer.svelte';
  import LineLayer from '../../src/lib/components/LineLayer.svelte';
  import SymbolLayer from '../../src/lib/components/SymbolLayer.svelte';
  import LayerManager from '../../src/lib/components/LayerManager.svelte';
  import DeckOverlay from '../../src/lib/components/DeckOverlay.svelte';
  import type { LayerState } from '../../src/lib/core/types.js';

  interface Props {
    only?: string[];
    onChange?: (layers: LayerState[]) => void;
    deckLayers?: unknown[] | null;
    onUnavailable?: () => void;
    showOpacity?: boolean;
  }

  let { only, onChange, deckLayers = null, onUnavailable, showOpacity = true }: Props = $props();
</script>

<MapView label="Layers" basemap="blank">
  <MapSource id="data">
    <FillLayer id="parks" label="Parks" paint={{ 'fill-opacity': 0.4 }} />
    <LineLayer id="roads" label="Roads" />
    <SymbolLayer id="names" label="Names" visible={false} />
  </MapSource>
  <LayerManager layers={only} {onChange} {showOpacity} />
  {#if deckLayers}<DeckOverlay layers={deckLayers} {onUnavailable} />{/if}
</MapView>
