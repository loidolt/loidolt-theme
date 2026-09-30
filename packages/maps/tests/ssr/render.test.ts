import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import * as lib from '../../src/lib/index.js';
import ContextHost from '../fixtures/ContextHost.svelte';

/**
 * Server-renders every component. MapLibre is never touched on the server: `MapView` renders
 * its frame, description and live region, and everything that goes on a map renders its markup
 * inside a map context that has no map yet.
 */
const standalone: Array<[keyof typeof lib, Record<string, unknown>, string]> = [
  ['MapView', { label: 'Stops', description: 'Five stops.' }, 'Five stops.'],
  ['MapLegend', { title: 'Key', items: [{ label: 'Park', color: '#d3d8bd' }] }, 'Park'],
  ['MapLegendGroup', { title: 'Keys', legends: [{ title: 'Parks' }] }, 'Parks'],
  [
    'MapFeatureList',
    { label: 'Stops', items: [{ id: 1, label: 'Depot', lngLat: [0, 0] }] },
    'Depot',
  ],
];

const inMap: Array<[keyof typeof lib, Record<string, unknown>, string]> = [
  ['MapMarker', { lngLat: [0, 0], label: 'Depot', onSelect: () => {} }, 'aria-label="Depot"'],
  ['MapPopup', { lngLat: [0, 0], label: 'Details' }, 'aria-label="Details"'],
  ['MapControl', {}, 'ldt-map-control'],
  ['MapLegend', { title: 'In map', items: [] }, 'In map'],
  ['CoordinateDisplay', {}, 'ldt-map-coordinates'],
  ['BasemapSwitcher', {}, 'Plain'],
  ['MapSource', { id: 'stops' }, ''],
  ['FillLayer', { id: 'fill', source: 'stops' }, ''],
  ['LineLayer', { id: 'line', source: 'stops' }, ''],
  ['CircleLayer', { id: 'circle', source: 'stops' }, ''],
  ['SymbolLayer', { id: 'symbol', source: 'stops' }, ''],
  ['FillExtrusionLayer', { id: 'extrusion', source: 'stops' }, ''],
  ['HeatmapLayer', { id: 'heat', source: 'stops' }, ''],
  ['RasterLayer', { id: 'raster', source: 'stops' }, ''],
];

describe('server rendering', () => {
  it('covers every exported component', () => {
    // PascalCase names are components; SCREAMING_CASE ones are constants.
    const components = Object.keys(lib).filter((name) => /^[A-Z][a-z]/.test(name));
    const covered = new Set([...standalone, ...inMap].map(([name]) => name));
    expect([...covered].sort()).toEqual(components.sort());
  });

  it.each(standalone)('%s renders on the server', (name, props, expected) => {
    const { body } = render(lib[name] as never, { props: props as never });
    expect(body).toContain(expected);
    expect(body).not.toContain('<canvas');
  });

  it.each(inMap)('%s renders inside a map on the server', (name, props, expected) => {
    const { body } = render(ContextHost, { props: { component: lib[name] as never, props } });
    expect(body).toContain(expected);
  });
});
