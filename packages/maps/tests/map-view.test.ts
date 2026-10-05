import { render, screen, waitFor } from '@testing-library/svelte';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { darkSemantic, semantic } from '@loidolt/theme-tokens';
import MapView from '../src/lib/components/MapView.svelte';
import { loadMapLibre, setMapLibreLoader, setMapLibreWorkerUrl } from '../src/lib/maplibre.js';
import { FakeMap, createFakeMapLibre, lastMap } from './fakes/maplibre.js';

let fake: ReturnType<typeof createFakeMapLibre>;

beforeEach(() => {
  fake = createFakeMapLibre();
  setMapLibreLoader(() => fake);
});

const loaded = async () => {
  await waitFor(() => expect(document.querySelector('.ldt-map[data-loaded]')).not.toBeNull());
  return lastMap();
};

describe('MapView', () => {
  it('names the canvas, describes it with its keyboard controls, and loads the loidolt basemap', async () => {
    const onLoad = vi.fn();
    render(MapView, { label: 'Delivery stops', description: 'Five stops downtown.', onLoad });
    const map = await loaded();
    const canvas = screen.getByRole('region', { name: 'Delivery stops' });
    expect(canvas).toBe(map.canvas);
    expect(canvas).toHaveAccessibleDescription(/^Five stops downtown\. Focus the map to move it/);
    expect(map.options).toMatchObject({ center: [0, 20], zoom: 1.5, attributionControl: false });
    expect((map.styleInput as { sources: object }).sources).toHaveProperty('ldt-base');
    expect(map.controls.map((control) => control.control.name)).toEqual([
      'attribution',
      'navigation',
    ]);
    expect(onLoad).toHaveBeenCalledWith(map);
  });

  it('adds the optional controls where asked', async () => {
    render(MapView, {
      label: 'Controls',
      fullscreenControl: true,
      geolocateControl: true,
      scaleControl: true,
      scaleUnit: 'imperial',
      navigationControl: false,
      controlPosition: 'top-left',
    });
    const map = await loaded();
    expect(map.controls.map(({ control, position }) => [control.name, position])).toEqual([
      ['attribution', 'bottom-right'],
      ['fullscreen', 'top-left'],
      ['geolocate', 'top-left'],
      ['scale', 'bottom-left'],
    ]);
    expect(map.controls[3].control.options).toEqual({ unit: 'imperial' });
  });

  it('draws the plain basemap or a style of your own', async () => {
    const { unmount } = render(MapView, { label: 'Plain', basemap: 'blank' });
    const plain = await loaded();
    expect((plain.styleInput as { name: string }).name).toBe('Loidolt plain');
    unmount();

    render(MapView, { label: 'Custom', mapStyle: 'https://example.test/style.json' });
    const custom = await loaded();
    expect(custom.styleInput).toBe('https://example.test/style.json');
  });

  it('swaps the style when the basemap changes', async () => {
    const { rerender } = render(MapView, { label: 'Switch' });
    const map = await loaded();
    await rerender({ basemap: 'blank' });
    await waitFor(() => expect(map.calls.some(([name]) => name === 'setStyle')).toBe(true));
    expect((map.styleInput as { name: string }).name).toBe('Loidolt plain');
  });

  it('repaints the basemap in place when the theme flips', async () => {
    render(MapView, { label: 'Theme', basemap: 'blank' });
    const map = await loaded();
    expect(map.getLayer('ldt-base-land')!.paint['background-color']).toBe(semantic.mapLand);
    document.documentElement.dataset.theme = 'dark';
    await waitFor(() =>
      expect(map.getLayer('ldt-base-land')!.paint['background-color']).toBe(darkSemantic.mapLand)
    );
    expect(map.calls.some(([name]) => name === 'setStyle')).toBe(false);
  });

  it('leaves a custom style alone on a theme flip', async () => {
    render(MapView, {
      label: 'Custom',
      mapStyle: {
        version: 8,
        sources: {},
        layers: [{ id: 'ldt-base-land', type: 'background', paint: {} }],
      },
    });
    const map = await loaded();
    document.documentElement.dataset.theme = 'dark';
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(map.calls.some(([name]) => name === 'setPaintProperty')).toBe(false);
  });

  it('reports clicks with the features under them', async () => {
    const onClick = vi.fn();
    render(MapView, { label: 'Clicks', onClick });
    const map = await loaded();
    map.fire('click', { lngLat: { lng: 1, lat: 2 }, point: { x: 3, y: 4 } });
    expect(onClick).toHaveBeenCalledWith({
      lngLat: [1, 2],
      point: [3, 4],
      features: [expect.objectContaining({ type: 'Feature' })],
    });
  });

  it('binds the view both ways and reports moves', async () => {
    const onMoveEnd = vi.fn();
    const { rerender } = render(MapView, { label: 'View', center: [10, 20], zoom: 4, onMoveEnd });
    const map = await loaded();
    map.jumpTo({ center: [11, 21], zoom: 5 });
    expect(onMoveEnd).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: [11, 21], zoom: 5, bearing: 0, pitch: 0 })
    );
    const calls = map.calls.length;
    await rerender({ center: [30, 40], zoom: 8 });
    await waitFor(() => expect(map.center).toEqual([30, 40]));
    expect(map.calls.slice(calls).map(([name]) => name)).toContain('easeTo');
  });

  it('jumps instead of easing when the user prefers reduced motion', async () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    })) as unknown as typeof window.matchMedia;
    try {
      const { rerender } = render(MapView, { label: 'Still', center: [0, 0] });
      const map = await loaded();
      expect(map.options.fadeDuration).toBe(0);
      await rerender({ center: [5, 5] });
      await waitFor(() => expect(map.calls.some(([name]) => name === 'jumpTo')).toBe(true));
    } finally {
      window.matchMedia = original;
    }
  });

  it('fits to bounds on load and when they change', async () => {
    const { rerender } = render(MapView, {
      label: 'Fit',
      bounds: [
        [0, 0],
        [2, 2],
      ],
    });
    const map = await loaded();
    const fits = () => map.calls.filter(([name]) => name === 'fitBounds');
    expect(fits()).toHaveLength(1);
    expect(fits()[0][2]).toMatchObject({ padding: 32, animate: false });
    await rerender({
      bounds: [
        [0, 0],
        [2, 2],
      ],
    });
    expect(fits()).toHaveLength(1);
    await rerender({
      bounds: [
        [5, 5],
        [6, 6],
      ],
    });
    await waitFor(() => expect(fits()).toHaveLength(2));
    expect(fits()[1][2]).toMatchObject({ animate: true });
  });

  it('fits the first bounds that arrive after load', async () => {
    const { rerender } = render(MapView, { label: 'Late fit' });
    const map = await loaded();
    const fits = () => map.calls.filter(([name]) => name === 'fitBounds');
    expect(fits()).toHaveLength(0);
    await rerender({
      bounds: [
        [0, 0],
        [2, 2],
      ],
    });
    await waitFor(() => expect(fits()).toHaveLength(1));
    expect(fits()[0][2]).toMatchObject({ padding: 32, animate: true });
    expect(map.center).toEqual([1, 1]);
  });

  it('fits a box on load only once', async () => {
    render(MapView, {
      label: 'Load fit',
      bounds: [
        [0, 0],
        [2, 2],
      ],
    });
    const map = await loaded();
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(map.calls.filter(([name]) => name === 'fitBounds')).toHaveLength(1);
  });

  it('fits the same box again after bounds were cleared', async () => {
    const box: [[number, number], [number, number]] = [
      [0, 0],
      [2, 2],
    ];
    const { rerender } = render(MapView, { label: 'Refit', bounds: box });
    const map = await loaded();
    const fits = () => map.calls.filter(([name]) => name === 'fitBounds');
    expect(fits()).toHaveLength(1);
    await rerender({ bounds: undefined });
    await rerender({ bounds: box });
    await waitFor(() => expect(fits()).toHaveLength(2));
  });

  it('lets bounds win over center and zoom changed in the same tick', async () => {
    const { rerender } = render(MapView, { label: 'Both', center: [10, 10], zoom: 3 });
    const map = await loaded();
    const calls = map.calls.length;
    await rerender({
      center: [30, 40],
      zoom: 8,
      bounds: [
        [0, 0],
        [2, 2],
      ],
    });
    await waitFor(() => expect(map.calls.some(([name]) => name === 'fitBounds')).toBe(true));
    const moves = map.calls
      .slice(calls)
      .map(([name]) => name)
      .filter((name) => ['easeTo', 'jumpTo', 'fit'].includes(name));
    expect(moves.at(-1)).toBe('fit');
    expect(map.center).toEqual([1, 1]);
  });

  it('announces where a keyboard move lands, and stays quiet for pointer moves', async () => {
    render(MapView, { label: 'Announce' });
    const map = await loaded();
    const region = document.querySelector('.ldt-map [aria-live]')!;
    map.jumpTo({ center: [5, 5], zoom: 3 });
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(region.textContent?.trim()).toBe('');
    map.keyboardPan([-122.68, 45.52]);
    await waitFor(() =>
      expect(region.textContent?.trim()).toBe(
        'Map centred on 45.52° N, 122.68° W at continent level.'
      )
    );
  });

  it('keeps the canvas name in step with the label', async () => {
    const { rerender } = render(MapView, { label: 'Before' });
    const map = await loaded();
    await rerender({ label: 'After' });
    expect(map.canvas).toHaveAttribute('aria-label', 'After');
  });

  it('shows why when the map cannot be drawn', async () => {
    FakeMap.failNext = true;
    const onError = vi.fn();
    render(MapView, { label: 'No WebGL', onError });
    expect(
      await screen.findByText('The map could not be shown in this browser.')
    ).toBeInTheDocument();
    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Failed to initialize WebGL' })
    );
  });

  it('shows why when MapLibre cannot load', async () => {
    setMapLibreLoader(() => {
      throw new Error('offline');
    });
    render(MapView, { label: 'Offline', unavailableText: 'No map today.' });
    expect(await screen.findByText('No map today.')).toBeInTheDocument();
  });

  it('treats errors before the style loads as fatal and after it as not', async () => {
    const onError = vi.fn();
    render(MapView, { label: 'Errors', onError });
    await waitFor(() => expect(FakeMap.instances).toHaveLength(1));
    const map = lastMap();
    await loaded();
    map.fire('error', { error: { message: 'tile 404' } });
    expect(onError).toHaveBeenLastCalledWith(expect.objectContaining({ message: 'tile 404' }));
    expect(screen.queryByText('tile 404')).toBeNull();
  });

  it('fails visibly when the style never loads', async () => {
    FakeMap.holdStyle = true;
    render(MapView, { label: 'Broken style' });
    await waitFor(() => expect(FakeMap.instances).toHaveLength(1));
    lastMap().fire('error', { error: new Error('Style 500') });
    expect(await screen.findByText('Style 500')).toBeInTheDocument();
    lastMap().fire('error', {});
    expect(await screen.findByText('Map error')).toBeInTheDocument();
  });

  it('removes the map on unmount, and never creates one it no longer needs', async () => {
    const { unmount } = render(MapView, { label: 'Gone' });
    const map = await loaded();
    unmount();
    expect(map.removed).toBe(true);

    let release: (value: unknown) => void = () => {};
    setMapLibreLoader(() => new Promise((resolve) => (release = resolve)));
    const count = FakeMap.instances.length;
    const late = render(MapView, { label: 'Late' });
    late.unmount();
    release(fake);
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(FakeMap.instances).toHaveLength(count);
  });
});

describe('loadMapLibre', () => {
  it('accepts MapLibre 6 named exports and MapLibre 5 default exports', async () => {
    setMapLibreLoader(() => ({ default: fake }));
    expect(await loadMapLibre()).toBe(fake);
    setMapLibreLoader(() => ({ nothing: true }));
    expect(await loadMapLibre()).toBeNull();
  });

  it('points MapLibre at its worker when told where it is', async () => {
    const setWorkerUrl = vi.fn();
    setMapLibreLoader(() => ({ ...fake, setWorkerUrl }));
    setMapLibreWorkerUrl('/worker.js');
    await loadMapLibre();
    expect(setWorkerUrl).toHaveBeenCalledWith('/worker.js');
    setMapLibreWorkerUrl(null);
  });

  it('loads the real library by default', async () => {
    setMapLibreLoader(null);
    const real = await loadMapLibre();
    expect(typeof real?.Map).toBe('function');
  });
});
