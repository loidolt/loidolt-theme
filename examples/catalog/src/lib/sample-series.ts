/** Demo data for the chart pages: a small cutting shop's year. */
export const monthly = {
  categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  series: [
    { name: 'Birch ply', data: [42, 48, 51, 63, 58, 66, 71, 69, 74, 80, 92, 88] },
    { name: 'Cork', data: [18, 22, 20, 25, 31, 29, 27, 33, 30, 36, 41, 39] },
    { name: 'Acrylic', data: [12, 10, 14, 13, 17, 16, 19, 18, 22, 21, 24, 26] },
  ],
};

export const materials = [
  { name: 'Birch ply', value: 812 },
  { name: 'Cork', value: 351 },
  { name: 'Acrylic', value: 212 },
  { name: 'MDF', value: 140 },
  { name: 'Card', value: 88 },
];

export const orderFunnel = [
  { name: 'Quotes', value: 420 },
  { name: 'Proofs sent', value: 310 },
  { name: 'Approved', value: 236 },
  { name: 'Cut', value: 221 },
  { name: 'Shipped', value: 214 },
];

export const runs = [
  {
    name: 'Birch 3 mm',
    data: [
      [12, 4.1],
      [18, 5.9],
      [25, 7.8],
      [31, 9.6],
      [40, 12.4],
      [46, 13.8],
      [55, 16.9],
    ] as Array<[number, number]>,
  },
  {
    name: 'Acrylic 3 mm',
    data: [
      [10, 5.2],
      [16, 7.9],
      [22, 10.1],
      [30, 13.8],
      [38, 16.9],
      [47, 21.2],
    ] as Array<[number, number]>,
  },
];

export const machines = {
  indicators: [
    { name: 'Speed', max: 10 },
    { name: 'Precision', max: 10 },
    { name: 'Bed size', max: 10 },
    { name: 'Uptime', max: 10 },
    { name: 'Cost', max: 10 },
  ],
  series: [
    { name: 'CO₂ laser', values: [7, 8, 9, 8, 6] },
    { name: 'Fibre laser', values: [9, 9, 5, 9, 4] },
  ],
};

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const hours = ['08:00', '10:00', '12:00', '14:00', '16:00'];
export const busyHours = {
  x: days,
  y: hours,
  values: days.flatMap((_, x) =>
    hours.map(
      (_, y) =>
        [x, y, Math.round(((x + 2) * (y + 3) * 7) % 23) + (x === 5 ? 0 : 4)] as [
          number,
          number,
          number,
        ]
    )
  ),
};

export const storage = [
  {
    name: 'Sheet stock',
    children: [
      { name: 'Birch ply', value: 420 },
      { name: 'Cork', value: 180 },
      { name: 'Acrylic', value: 120 },
    ],
  },
  {
    name: 'Offcuts',
    children: [
      { name: 'Reusable', value: 140 },
      { name: 'Scrap', value: 60 },
    ],
  },
  { name: 'Finished parts', value: 210 },
];

export const prices = [
  { date: 'Mar 3', open: 20.1, close: 21.4, low: 19.8, high: 21.9, volume: 1200 },
  { date: 'Mar 4', open: 21.4, close: 20.9, low: 20.5, high: 22.0, volume: 980 },
  { date: 'Mar 5', open: 20.9, close: 22.6, low: 20.7, high: 23.1, volume: 1540 },
  { date: 'Mar 6', open: 22.6, close: 22.1, low: 21.7, high: 22.9, volume: 870 },
  { date: 'Mar 7', open: 22.1, close: 23.5, low: 22.0, high: 23.8, volume: 1320 },
  { date: 'Mar 10', open: 23.5, close: 23.0, low: 22.6, high: 24.0, volume: 1010 },
  { date: 'Mar 11', open: 23.0, close: 24.2, low: 22.9, high: 24.6, volume: 1480 },
  { date: 'Mar 12', open: 24.2, close: 23.8, low: 23.4, high: 24.5, volume: 900 },
];

export const materialFlow = {
  nodes: [
    { name: 'Sheets in' },
    { name: 'Cut parts' },
    { name: 'Offcuts' },
    { name: 'Shipped' },
    { name: 'Reworked' },
    { name: 'Reused' },
    { name: 'Scrap' },
  ],
  links: [
    { source: 'Sheets in', target: 'Cut parts', value: 72 },
    { source: 'Sheets in', target: 'Offcuts', value: 28 },
    { source: 'Cut parts', target: 'Shipped', value: 66 },
    { source: 'Cut parts', target: 'Reworked', value: 6 },
    { source: 'Offcuts', target: 'Reused', value: 19 },
    { source: 'Offcuts', target: 'Scrap', value: 9 },
  ],
};
