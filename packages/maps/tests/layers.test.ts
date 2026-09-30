import { render, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import { setMapLibreLoader } from '../src/lib/maplibre.js';
import { createFakeMapLibre, lastMap } from './fakes/maplibre.js';
import LayersHarness from './fixtures/LayersHarness.svelte';

beforeEach(() => {
  const fake = createFakeMapLibre();
  setMapLibreLoader(() => fake);
});

const withLayer = async (id = 'parks-fill') => {
  await waitFor(() => expect(lastMap()?.getLayer(id)).toBeDefined());
  return lastMap();
};

const park = {
  type: 'FeatureCollection' as const,
  features: [
    {
      type: 'Feature' as const,
      id: 1,
      properties: { name: 'Laurelhurst' },
      geometry: { type: 'Point' as const, coordinates: [-122.62, 45.52] },
    },
  ],
};

describe('MapSource', () => {
  it('adds a GeoJSON source and replaces its data in place', async () => {
    const { rerender } = render(LayersHarness, { data: park });
    const map = await withLayer();
    expect(map.getSource('parks')).toMatchObject({ type: 'geojson', data: park });
    const next = { ...park, features: [] };
    await rerender({ data: next });
    await waitFor(() => expect(map.getSource('parks').data).toBe(next));
    // The layer drawing it was not touched.
    expect(map.calls.filter(([name]) => name === 'addLayer')).toHaveLength(1);
  });

  it('clusters points when asked', async () => {
    render(LayersHarness, {
      cluster: { radius: 30, maxZoom: 10, properties: { total: ['+', 1] } },
    });
    const map = await withLayer();
    expect(map.getSource('parks')).toMatchObject({
      cluster: true,
      clusterRadius: 30,
      clusterMaxZoom: 10,
      clusterMinPoints: 2,
      clusterProperties: { total: ['+', 1] },
    });
  });

  it('takes any other source by its specification', async () => {
    render(LayersHarness, { all: true });
    const map = await withLayer('aerial-raster');
    expect(map.getSource('aerial')).toMatchObject({ type: 'raster', attribution: 'Aerial' });
  });

  it('removes its layers, then itself, on unmount', async () => {
    const { rerender } = render(LayersHarness, {});
    const map = await withLayer();
    await rerender({ showSource: false });
    await waitFor(() => expect(map.getSource('parks')).toBeUndefined());
    expect(map.getLayer('parks-fill')).toBeUndefined();
  });

  it('re-adds everything after a basemap swap', async () => {
    const { rerender } = render(LayersHarness, { data: park });
    const map = await withLayer();
    await rerender({ basemap: 'default' });
    await waitFor(() => expect(map.calls.filter(([name]) => name === 'addLayer')).toHaveLength(2));
    expect(map.getSource('parks')).toBeDefined();
    expect(map.getLayer('parks-fill')).toBeDefined();
    expect(map.getLayer('ldt-base-water')).toBeDefined();
  });
});

describe('layers', () => {
  it('merges its paint over themed defaults', async () => {
    render(LayersHarness, { fill: { paint: { 'fill-opacity': 0.5 } } });
    const map = await withLayer();
    expect(map.getLayer('parks-fill')).toMatchObject({
      type: 'fill',
      source: 'parks',
      paint: {
        'fill-color': semantic.chart1,
        'fill-outline-color': semantic.chart1,
        'fill-opacity': 0.5,
      },
      layout: { visibility: 'visible' },
    });
  });

  it('adds every layer type with sensible defaults', async () => {
    render(LayersHarness, { all: true });
    const map = await withLayer('outside');
    const type = (id: string) => map.getLayer(id)!.type;
    expect(
      ['parks-line', 'parks-circle', 'parks-label', 'parks-3d', 'parks-heat', 'aerial-raster'].map(
        type
      )
    ).toEqual(['line', 'circle', 'symbol', 'fill-extrusion', 'heatmap', 'raster']);
    expect(map.getLayer('parks-circle')!.paint['circle-color']).toBe(semantic.accent);
    expect(map.getLayer('parks-label')!.layout).toMatchObject({ 'text-field': ['get', 'name'] });
    expect(map.getLayer('parks-heat')!.paint['heatmap-color']).toContain(semantic.chartSequential5);
    // Named source outside any MapSource, drawn beneath another layer.
    const ids = map.style.layers.map((layer) => layer.id);
    expect(ids.indexOf('outside')).toBeLessThan(ids.indexOf('parks-fill'));
  });

  it('sends only what changed', async () => {
    const { rerender } = render(LayersHarness, { fill: { paint: { 'fill-opacity': 0.5 } } });
    const map = await withLayer();
    const before = map.calls.length;
    await rerender({ fill: { paint: { 'fill-opacity': 0.7 } } });
    await waitFor(() => expect(map.getLayer('parks-fill')!.paint['fill-opacity']).toBe(0.7));
    expect(map.calls.slice(before)).toEqual([
      ['setPaintProperty', 'parks-fill', 'fill-opacity', 0.7],
    ]);
  });

  it('updates visibility, layout, filter, zoom range and order', async () => {
    const { rerender } = render(LayersHarness, { all: true });
    const map = await withLayer('outside');
    await rerender({
      all: true,
      fill: {
        visible: false,
        filter: ['==', ['get', 'kind'], 'park'],
        minZoom: 5,
        maxZoom: 12,
        layout: { 'fill-sort-key': 1 },
        beforeId: 'parks-line',
      },
    });
    await waitFor(() => expect(map.getLayer('parks-fill')!.layout.visibility).toBe('none'));
    const layer = map.getLayer('parks-fill')!;
    expect(layer.filter).toEqual(['==', ['get', 'kind'], 'park']);
    expect(layer).toMatchObject({ minzoom: 5, maxzoom: 12 });
    expect(layer.layout['fill-sort-key']).toBe(1);
    expect(map.calls).toContainEqual(['moveLayer', 'parks-fill', 'parks-line']);

    await rerender({ all: true, fill: {} });
    await waitFor(() => expect(map.getLayer('parks-fill')!.layout.visibility).toBe('visible'));
    expect(map.getLayer('parks-fill')!.filter).toBeUndefined();
    expect(map.calls.at(-1)).toEqual(['moveLayer', 'parks-fill', undefined]);
  });

  it('recolours from a paint function when the theme flips', async () => {
    render(LayersHarness, {
      fill: { paint: (colors: { accent: string }) => ({ 'fill-color': colors.accent }) },
    });
    const map = await withLayer();
    expect(map.getLayer('parks-fill')!.paint['fill-color']).toBe(semantic.accent);
    document.documentElement.dataset.theme = 'dark';
    await waitFor(() =>
      expect(map.getLayer('parks-fill')!.paint['fill-color']).toBe(darkSemantic.accent)
    );
    expect(map.getLayer('parks-fill')!.paint['fill-outline-color']).toBe(darkSemantic.chart1);
  });

  it('reports clicks and hovers, with a pointer cursor and hover state', async () => {
    const onClick = vi.fn();
    const onHover = vi.fn();
    render(LayersHarness, { data: park, fill: { onClick, onHover } });
    const map = await withLayer();
    await waitFor(() => expect(map.listenerCount('click', 'parks-fill')).toBe(1));
    const feature = { ...park.features[0], source: 'parks' };
    const event = { features: [feature], lngLat: { lng: 1, lat: 2 }, point: { x: 3, y: 4 } };

    map.fireLayer('mousemove', 'parks-fill', event);
    expect(map.canvas.style.cursor).toBe('pointer');
    expect(map.featureStates.get('parks:1')).toEqual({ hover: true });
    expect(onHover).toHaveBeenLastCalledWith(
      expect.objectContaining({ feature, lngLat: [1, 2], point: [3, 4] })
    );
    map.fireLayer('mousemove', 'parks-fill', { ...event, features: [] });

    map.fireLayer('click', 'parks-fill', event);
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ features: [feature] }));
    map.fireLayer('click', 'parks-fill', { ...event, features: [] });
    expect(onClick).toHaveBeenCalledTimes(1);

    map.fireLayer('mouseleave', 'parks-fill', {});
    expect(map.canvas.style.cursor).toBe('');
    expect(map.featureStates.get('parks:1')).toEqual({ hover: false });
    expect(onHover).toHaveBeenLastCalledWith(null);
  });

  it('removes the layer and its listeners on unmount', async () => {
    const { rerender } = render(LayersHarness, { fill: { onClick: () => {} } });
    const map = await withLayer();
    await waitFor(() => expect(map.listenerCount('click', 'parks-fill')).toBe(1));
    await rerender({ showFill: false });
    await waitFor(() => expect(map.getLayer('parks-fill')).toBeUndefined());
    expect(map.listenerCount('click', 'parks-fill')).toBe(0);
  });
});
