import { render, screen, waitFor } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import MapFeatureList from '../src/lib/components/MapFeatureList.svelte';
import MapLegend from '../src/lib/components/MapLegend.svelte';
import MapLegendGroup from '../src/lib/components/MapLegendGroup.svelte';
import MapMarker from '../src/lib/components/MapMarker.svelte';
import { setMapLibreLoader } from '../src/lib/maplibre.js';
import { FakeMarker, FakePopup, createFakeMapLibre, lastMap } from './fakes/maplibre.js';
import MarkersHarness from './fixtures/MarkersHarness.svelte';

const markers: FakeMarker[] = [];
const popups: FakePopup[] = [];

beforeEach(() => {
  markers.length = 0;
  popups.length = 0;
  const fake = createFakeMapLibre();
  setMapLibreLoader(() => ({
    ...fake,
    Marker: class extends FakeMarker {
      constructor(options: Record<string, unknown>) {
        super(options);
        markers.push(this);
      }
    },
    Popup: class extends FakePopup {
      constructor(options: Record<string, unknown>) {
        super(options);
        popups.push(this);
      }
    },
  }));
});

const ready = async () => {
  await waitFor(() => expect(markers.length).toBe(3));
  return lastMap();
};

describe('MapMarker', () => {
  it('puts a named, focusable pin on the map, pointing from its bottom-left corner', async () => {
    const onSelect = vi.fn();
    render(MarkersHarness, { onSelect });
    const map = await ready();
    const pin = screen.getByRole('button', { name: 'Workshop' });
    expect(map.canvasContainer.contains(pin)).toBe(true);
    expect(markers[0].options.anchor).toBe('bottom-left');
    expect(markers[0].lngLat).toEqual([-122.68, 45.52]);
    expect(pin.querySelector('.ldt-marker--pin')).toHaveTextContent('1');
    await userEvent.click(pin);
    expect(onSelect).toHaveBeenCalledOnce();
    pin.focus();
    await userEvent.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(2);
  });

  it('is a named picture, not a dead tab stop, when there is nothing to do', async () => {
    render(MarkersHarness, {});
    await ready();
    expect(screen.getByRole('img', { name: 'Landmark' })).not.toHaveAttribute('tabindex');
    expect(screen.queryByRole('button', { name: 'Landmark' })).toBeNull();
  });

  it('follows its coordinates and drags', async () => {
    const onDragEnd = vi.fn();
    // With `onSelect` it stays a button whether or not it drags.
    const { rerender } = render(MarkersHarness, { onDragEnd, draggable: true, onSelect: () => {} });
    await ready();
    expect(markers[0].draggable).toBe(true);
    await rerender({ lngLat: [1, 2] });
    expect(markers[0].lngLat).toEqual([1, 2]);
    await rerender({ draggable: false });
    expect(markers[0].draggable).toBe(false);
    markers[0].setLngLat([3, 4]);
    markers[0].fire('dragend');
    expect(onDragEnd).toHaveBeenCalledWith([3, 4]);
  });

  it('opens its popup, moves focus in, and brings it back on Escape', async () => {
    render(MarkersHarness, {});
    await ready();
    const depot = screen.getByRole('button', { name: 'Depot' });
    expect(markers[1].options.anchor).toBe('center');
    expect(depot).toHaveAttribute('aria-haspopup', 'dialog');
    expect(depot).toHaveAttribute('aria-expanded', 'false');
    depot.focus();
    await userEvent.keyboard('{Enter}');
    const dialog = await screen.findByRole('dialog', { name: 'Depot' });
    expect(depot).toHaveAttribute('aria-expanded', 'true');
    await waitFor(() => expect(dialog).toHaveFocus());
    expect(dialog).toHaveTextContent('Open 8–5');
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Depot' })).toBeNull());
    expect(depot).toHaveFocus();
    expect(depot).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes its popup from the close button and when the map closes it', async () => {
    render(MarkersHarness, {});
    await ready();
    const depot = screen.getByRole('button', { name: 'Depot' });
    await userEvent.click(depot);
    await screen.findByRole('dialog', { name: 'Depot' });
    await userEvent.click(screen.getAllByRole('button', { name: 'Close' })[0]);
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Depot' })).toBeNull());

    await userEvent.click(depot);
    await screen.findByRole('dialog', { name: 'Depot' });
    // A click on the map, as MapLibre's `closeOnClick` does it.
    popups.find((popup) => popup.isOpen())!.remove();
    await waitFor(() => expect(depot).toHaveAttribute('aria-expanded', 'false'));
  });
});

describe('outside a map', () => {
  it('says where map children belong', () => {
    expect(() => render(MapMarker, { lngLat: [0, 0], label: 'Lost' })).toThrow(
      'MapMarker must be placed inside a <MapView>.'
    );
  });
});

describe('MapPopup', () => {
  it('opens and closes from its bound state, without a MapLibre close button', async () => {
    const { rerender } = render(MarkersHarness, {});
    await ready();
    const standalone = popups.find(
      (popup) => popup.content?.getAttribute('aria-label') === 'Standalone'
    )!;
    expect(standalone.options).toMatchObject({
      closeButton: false,
      focusAfterOpen: false,
      closeOnClick: true,
    });
    expect(standalone.isOpen()).toBe(false);
    await rerender({ standaloneOpen: true });
    await waitFor(() => expect(standalone.isOpen()).toBe(true));
    expect(standalone.lngLat).toEqual([-122.7, 45.6]);
    await rerender({ standaloneOpen: false });
    await waitFor(() => expect(standalone.isOpen()).toBe(false));
  });

  it('removes its popup and marker on unmount', async () => {
    const { unmount } = render(MarkersHarness, {});
    const map = await ready();
    unmount();
    expect(map.canvasContainer.querySelector('.ldt-map-marker')).toBeNull();
  });
});

describe('map controls', () => {
  it('adds legends, coordinates and the basemap switcher as map controls', async () => {
    const onBasemap = vi.fn();
    render(MarkersHarness, { onBasemap });
    const map = await ready();
    const custom = map.controls.filter(({ control }) => !control.name);
    expect(custom.map(({ position }) => position)).toEqual([
      'bottom-left',
      'top-left',
      'bottom-left',
      'top-left',
    ]);

    const legend = screen.getByRole('region', { name: 'Status' });
    expect(legend).toHaveTextContent('Open');
    expect(legend.querySelector('.ldt-map-legend__key--line')).not.toBeNull();
    expect(legend).toHaveTextContent('Few');

    const group = screen.getByRole('region', { name: 'Layers' });
    const sections = group.querySelectorAll('details');
    expect(sections[0]).toHaveProperty('open', true);
    expect(sections[1]).toHaveProperty('open', false);

    expect(document.querySelector('.ldt-map-coordinates')).toHaveTextContent(
      '20.00000° N, 0.00000° E'
    );
    map.fire('mousemove', { lngLat: { lng: 1, lat: 2 } });
    await waitFor(() =>
      expect(document.querySelector('.ldt-map-coordinates')).toHaveTextContent(
        '2.00000° N, 1.00000° E'
      )
    );
    map.fire('mouseout');
    map.jumpTo({ zoom: 6 });
    await waitFor(() =>
      expect(document.querySelector('.ldt-map-coordinates')).toHaveTextContent('Zoom 6.0')
    );

    // The harness starts on the plain basemap; pressing it again changes nothing.
    await userEvent.click(screen.getByRole('radio', { name: 'Plain' }));
    expect(onBasemap).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('radio', { name: 'Map' }));
    expect(onBasemap).toHaveBeenCalledWith('default');
    await waitFor(() => expect(map.calls.some(([name]) => name === 'setStyle')).toBe(true));
  });

  it('renders legends in the page flow outside a map', () => {
    render(MapLegend, { title: 'Key', items: [{ label: 'Park', color: '#d3d8bd', shape: 'dot' }] });
    expect(
      screen.getByRole('region', { name: 'Key' }).querySelector('.ldt-map-legend__key--dot')
    ).not.toBeNull();
    render(MapLegendGroup, {
      title: 'Keys',
      legends: [{ title: 'One', items: [{ label: 'A', color: '#000000' }] }],
    });
    expect(screen.getByRole('region', { name: 'Keys' })).toHaveTextContent('One');
  });
});

describe('MapFeatureList', () => {
  it('lists every place and flies to the one chosen', async () => {
    const flyTo = vi.fn();
    const jumpTo = vi.fn();
    const onSelect = vi.fn();
    const map = { flyTo, jumpTo, getZoom: () => 16 };
    render(MapFeatureList, {
      label: 'Stops',
      map: map as never,
      items: [
        { id: 1, label: 'Workshop', lngLat: [1, 2], description: 'Main site' },
        { id: 2, label: 'Depot', lngLat: [3, 4] },
      ],
      onSelect,
    });
    const nav = screen.getByRole('navigation', { name: 'Stops' });
    expect(nav).toHaveTextContent('Main site');
    await userEvent.click(screen.getByRole('button', { name: /Depot/ }));
    expect(flyTo).toHaveBeenCalledWith({ center: [3, 4], zoom: 16 });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
    expect(screen.getByRole('button', { name: /Depot/ })).toHaveAttribute('aria-current', 'true');
  });

  it('finds the map from inside a MapView, and jumps for reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      const onFeature = vi.fn();
      render(MarkersHarness, { onFeature });
      const map = await ready();
      const list = screen.getByRole('navigation', { name: 'Stops list', hidden: true });
      list.querySelectorAll('button')[1].click();
      expect(onFeature).toHaveBeenCalledWith('b');
      expect(map.calls.at(-1)).toEqual(['jumpTo', { center: [-122.6, 45.5], zoom: 14 }]);
    } finally {
      window.matchMedia = original;
    }
  });
});
