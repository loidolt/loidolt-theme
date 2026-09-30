import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { axe } from 'vitest-axe';
import MapFeatureList from '../src/lib/components/MapFeatureList.svelte';
import MapLegend from '../src/lib/components/MapLegend.svelte';
import MapView from '../src/lib/components/MapView.svelte';
import { setMapLibreLoader } from '../src/lib/maplibre.js';
import { FakeMap, createFakeMapLibre } from './fakes/maplibre.js';
import LayersHarness from './fixtures/LayersHarness.svelte';
import MarkersHarness from './fixtures/MarkersHarness.svelte';

beforeEach(() => {
  const fake = createFakeMapLibre();
  setMapLibreLoader(() => fake);
});

const loaded = () =>
  waitFor(() => expect(document.querySelector('.ldt-map[data-loaded]')).not.toBeNull());

describe('map accessibility', () => {
  it('passes axe with markers, a popup, legends and controls', async () => {
    const { container } = render(MarkersHarness, {});
    await loaded();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Depot' })).toBeInTheDocument());
    expect((await axe(container)).violations).toEqual([]);
    await userEvent.click(screen.getByRole('button', { name: 'Depot' }));
    await screen.findByRole('dialog', { name: 'Depot' });
    // The whole body now, since the popup lives outside the container. `region` is a page-level
    // rule (content outside landmarks), which a bare test body cannot satisfy.
    expect(
      (await axe(document.body, { rules: { region: { enabled: false } } })).violations
    ).toEqual([]);
  });

  it('passes axe with data layers', async () => {
    const { container } = render(LayersHarness, { all: true });
    await loaded();
    expect((await axe(container)).violations).toEqual([]);
  });

  it('passes axe when the map cannot be shown', async () => {
    FakeMap.failNext = true;
    const { container } = render(MapView, { label: 'Broken' });
    await screen.findByText(/could not be shown/);
    expect((await axe(container)).violations).toEqual([]);
  });

  it('passes axe for the parts that work without a map', async () => {
    const { container } = render(MapFeatureList, {
      label: 'Stops',
      items: [{ id: 1, label: 'Depot', lngLat: [0, 0], description: 'North yard' }],
    });
    expect((await axe(container)).violations).toEqual([]);
    const legend = render(MapLegend, {
      title: 'Key',
      items: [{ label: 'Park', color: '#d3d8bd' }],
    });
    expect((await axe(legend.container)).violations).toEqual([]);
  });
});
