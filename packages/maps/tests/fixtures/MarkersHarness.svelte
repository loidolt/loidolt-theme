<script lang="ts">
  import MapView from '../../src/lib/components/MapView.svelte';
  import MapMarker from '../../src/lib/components/MapMarker.svelte';
  import MapPopup from '../../src/lib/components/MapPopup.svelte';
  import MapLegend from '../../src/lib/components/MapLegend.svelte';
  import MapLegendGroup from '../../src/lib/components/MapLegendGroup.svelte';
  import CoordinateDisplay from '../../src/lib/components/CoordinateDisplay.svelte';
  import BasemapSwitcher from '../../src/lib/components/BasemapSwitcher.svelte';
  import MapFeatureList from '../../src/lib/components/MapFeatureList.svelte';
  import type { LngLat } from '../../src/lib/core/types.js';

  interface Props {
    lngLat?: LngLat;
    draggable?: boolean;
    onSelect?: () => void;
    onDragEnd?: (lngLat: LngLat) => void;
    popupOpen?: boolean;
    standaloneOpen?: boolean;
    onBasemap?: (id: string) => void;
    onFeature?: (id: string | number) => void;
  }

  let {
    lngLat = [-122.68, 45.52],
    draggable = false,
    onSelect,
    onDragEnd,
    popupOpen = $bindable(false),
    standaloneOpen = $bindable(false),
    onBasemap,
    onFeature,
  }: Props = $props();
</script>

<MapView label="Stops" basemap="blank">
  <MapMarker {lngLat} label="Workshop" number={1} {draggable} {onSelect} {onDragEnd}></MapMarker>
  <MapMarker lngLat={[-122.6, 45.5]} label="Depot" shape="dot" bind:popupOpen>
    {#snippet popup()}<p>Open 8–5</p>
      <a href="#hours">Hours</a>{/snippet}
  </MapMarker>
  <MapMarker lngLat={[-122.5, 45.4]} label="Landmark" />
  <MapPopup lngLat={[-122.7, 45.6]} label="Standalone" bind:open={standaloneOpen}>
    <p>Standalone content</p>
  </MapPopup>
  <MapLegend
    title="Status"
    items={[
      { label: 'Open', color: '#3f5139' },
      { label: 'Route', color: '#c65224', shape: 'line' },
    ]}
    gradient={{ colors: ['#ecd3b8', '#6e3314'], min: 'Few', max: 'Many' }}
  />
  <MapLegendGroup
    title="Layers"
    position="top-left"
    legends={[
      { title: 'Parks', items: [{ label: 'Park', color: '#d3d8bd' }] },
      {
        title: 'Density',
        gradient: { colors: ['#ecd3b8', '#6e3314'], min: '0', max: '9' },
        open: false,
      },
    ]}
  />
  <CoordinateDisplay />
  <BasemapSwitcher onChange={onBasemap} />
  <MapFeatureList
    label="Stops list"
    items={[
      { id: 'a', label: 'Workshop', lngLat: [-122.68, 45.52], description: 'Main site' },
      { id: 'b', label: 'Depot', lngLat: [-122.6, 45.5] },
    ]}
    onSelect={(item) => onFeature?.(item.id)}
  />
</MapView>
