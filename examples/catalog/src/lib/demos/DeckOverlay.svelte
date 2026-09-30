<script lang="ts">
  import { Button } from '@loidolt/theme-svelte';
  import { DeckOverlay, MapView } from '@loidolt/theme-maps';
  import { chartColors } from '@loidolt/theme-tokens';
  import { jobs, portland } from '$lib/sample-geo.js';

  // deck.gl wants colours as [r, g, b, a]; take them from the chart tokens.
  const rgb = (hex: string, alpha = 200): [number, number, number, number] => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
    alpha,
  ];
  type Job = (typeof jobs.features)[number];
  const position = (job: Job) =>
    (job.geometry as unknown as { coordinates: [number, number] }).coordinates;

  let layers = $state<unknown[] | null>(null);
  let loading = $state(false);

  // Loaded on demand: deck.gl is large, and only this page needs it.
  async function show() {
    loading = true;
    const { ColumnLayer } = await import('@deck.gl/layers');
    const [low, high] = [chartColors().categorical[1], chartColors().categorical[0]];
    layers = [
      new ColumnLayer({
        id: 'job-columns',
        data: jobs.features,
        diskResolution: 4,
        radius: 60,
        extruded: true,
        elevationScale: 120,
        getPosition: position,
        getElevation: (job: Job) => job.properties!.weight,
        getFillColor: (job: Job) => rgb(job.properties!.weight > 3 ? high : low),
      }),
    ];
    loading = false;
  }
</script>

<div class="ldt-stack">
  <MapView label="Jobs as columns" center={portland} zoom={12.4} pitch={45} height={380}>
    {#if layers}<DeckOverlay {layers} />{/if}
  </MapView>
  <div>
    <Button size="sm" onclick={show} disabled={loading || layers !== null}>
      {layers ? 'deck.gl layer shown' : 'Show a deck.gl layer'}
    </Button>
  </div>
</div>
