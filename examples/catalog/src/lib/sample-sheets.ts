/** Sample rows for the data-table demos. */
export interface SampleSheet {
  id: string;
  name: string;
  stock: 'Birch ply' | 'Acrylic' | 'Cork' | 'Mount board';
  layers: number;
  status: 'Ready' | 'In review' | 'Blocked';
  updated: Date;
}

const stocks: SampleSheet['stock'][] = ['Birch ply', 'Acrylic', 'Cork', 'Mount board'];
const statuses: SampleSheet['status'][] = ['Ready', 'In review', 'Ready', 'Blocked'];
const parts = ['Bracket', 'Coaster', 'Sign', 'Enclosure', 'Panel', 'Gear', 'Tray', 'Stencil'];

export const sampleSheets: SampleSheet[] = Array.from({ length: 42 }, (_, index) => ({
  id: `sheet-${index + 1}`,
  name: `${parts[index % parts.length]} ${Math.floor(index / parts.length) + 1}`,
  stock: stocks[(index * 3) % stocks.length],
  layers: ((index * 7) % 11) + 1,
  status: statuses[(index * 5) % statuses.length],
  // Fixed dates, so the prerendered page and the hydrated one agree.
  updated: new Date(Date.UTC(2026, 8, 1 + (index % 28))),
}));
