import type { MediaItem } from '@loidolt/theme-svelte';

/** Inline SVG "photos" so the media demos need no network. */
const plate = (fill: string, accent: string, label: string) =>
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect width="400" height="300" fill="${fill}"/><path d="M0 220 120 140l80 60 90-90 110 110v100H0z" fill="${accent}" opacity=".85"/><circle cx="310" cy="70" r="28" fill="#ebe7dc"/><text x="20" y="40" font-family="sans-serif" font-size="22" fill="#ebe7dc">${label}</text></svg>`
  );

export const sampleMedia = (base: string): MediaItem[] => [
  {
    kind: 'image',
    src: plate('#265162', '#3f5139', 'Ridge'),
    alt: 'Ridge relief, birch ply',
    caption: 'Ridge relief — 14 layers of birch ply',
  },
  {
    kind: 'image',
    src: plate('#7c4d17', '#c65224', 'Canyon'),
    alt: 'Canyon relief, cork',
    caption: 'Canyon relief — cork on MDF',
  },
  {
    kind: 'video',
    src: `${base}/media/sample-cut.webm`,
    title: 'Cutting a bracket',
    poster: `${base}/media/sample-poster.svg`,
    tracks: [{ src: `${base}/media/sample-cut.en.vtt`, srclang: 'en', label: 'English' }],
    caption: 'Four-second cut, with captions',
  },
  {
    kind: 'image',
    src: plate('#20231d', '#847d6a', 'Coast'),
    alt: 'Coastline relief, acrylic',
    caption: 'Coastline — smoked acrylic',
  },
  {
    kind: 'audio',
    src: `${base}/media/sample-tone.wav`,
    title: 'Calibration tone',
    artist: 'Workshop sounds',
    artwork: `${base}/media/sample-artwork.svg`,
  },
  {
    kind: 'image',
    src: plate('#3f5139', '#265162', 'Lake'),
    alt: 'Lake relief, birch and acrylic',
    caption: 'Lake — birch with an acrylic water layer',
  },
];
