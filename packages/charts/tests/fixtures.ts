/** Small datasets every wrapper test, a11y test and SSR test shares. */
export const samples = {
  category: {
    categories: ['Jan', 'Feb', 'Mar'],
    series: [
      { name: 'Cuts', data: [4, 6, 9] },
      { name: 'Scrap', data: [3, 2, 1] },
    ],
  },
  slices: [
    { name: 'Birch', value: 6 },
    { name: 'Cork', value: 2 },
  ],
  scatter: [
    {
      name: 'Runs',
      data: [
        [1, 2],
        [2, 4],
      ] as Array<[number, number]>,
    },
  ],
  radar: {
    indicators: [{ name: 'Speed' }, { name: 'Finish' }, { name: 'Cost' }],
    series: [{ name: 'Laser', values: [8, 6, 4] }],
  },
  gauge: { value: 72 },
  heatmap: {
    x: ['Mon', 'Tue'],
    y: ['AM', 'PM'],
    values: [
      [0, 0, 1],
      [1, 1, 9],
    ] as Array<[number, number, number | null]>,
  },
  treemap: [
    { name: 'Wood', children: [{ name: 'Birch', value: 5 }] },
    { name: 'Cork', value: 2 },
  ],
  candlestick: [
    { date: 'Mon', open: 10, close: 12, low: 9, high: 13 },
    { date: 'Tue', open: 12, close: 11, low: 10, high: 12.5 },
  ],
  sankey: {
    nodes: [{ name: 'Sheet' }, { name: 'Parts' }],
    links: [{ source: 'Sheet', target: 'Parts', value: 8 }],
  },
};
