import type { FeatureCollection, LngLat } from '@loidolt/theme-maps/core';

/** Demo data for the map pages: a small workshop's deliveries around Portland, Oregon. */
export const portland: LngLat = [-122.6765, 45.5231];

export const stops = [
  {
    id: 'workshop',
    label: 'Workshop',
    lngLat: [-122.6587, 45.5122] as LngLat,
    description: 'SE Water Ave · pick-up',
  },
  {
    id: 'gallery',
    label: 'Gallery',
    lngLat: [-122.6819, 45.5266] as LngLat,
    description: 'NW 9th Ave · framed prints',
  },
  {
    id: 'school',
    label: 'Design school',
    lngLat: [-122.6852, 45.5118] as LngLat,
    description: 'SW Park Ave · laser kits',
  },
  {
    id: 'studio',
    label: 'Studio',
    lngLat: [-122.6436, 45.5408] as LngLat,
    description: 'NE Broadway · signage',
  },
  {
    id: 'market',
    label: 'Market stall',
    lngLat: [-122.6703, 45.5019] as LngLat,
    description: 'SW Harbor Way · Saturdays',
  },
];

/** Stops as GeoJSON, with a name to label. */
export const stopPoints: FeatureCollection<{ name: string; kind: string }> = {
  type: 'FeatureCollection',
  features: stops.map((stop, index) => ({
    type: 'Feature',
    id: index + 1,
    geometry: { type: 'Point', coordinates: stop.lngLat },
    properties: { name: stop.label, kind: index % 2 ? 'Delivery' : 'Pick-up' },
  })),
};

/** The delivery loop, in order. */
export const route: FeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [...stops.map((stop) => stop.lngLat), stops[0].lngLat],
      },
      properties: {},
    },
  ],
};

/** Two service areas, drawn as rough boxes. */
export const areas: FeatureCollection<{ name: string }> = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      id: 1,
      properties: { name: 'Same-day zone' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.695, 45.5],
            [-122.65, 45.5],
            [-122.65, 45.53],
            [-122.695, 45.53],
            [-122.695, 45.5],
          ],
        ],
      },
    },
    {
      type: 'Feature',
      id: 2,
      properties: { name: 'Next-day zone' },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [-122.65, 45.525],
            [-122.625, 45.525],
            [-122.625, 45.55],
            [-122.65, 45.55],
            [-122.65, 45.525],
          ],
        ],
      },
    },
  ],
};

/** A scatter of recent jobs for heatmaps and clusters, deterministic so builds are stable. */
export const jobs: FeatureCollection<{ weight: number }> = {
  type: 'FeatureCollection',
  features: Array.from({ length: 120 }, (_, index) => {
    const angle = index * 2.399963;
    const radius = 0.004 + (index % 17) * 0.0014;
    return {
      type: 'Feature',
      id: index,
      properties: { weight: 1 + (index % 5) },
      geometry: {
        type: 'Point',
        coordinates: [-122.67 + Math.cos(angle) * radius * 1.4, 45.52 + Math.sin(angle) * radius],
      },
    };
  }),
};
