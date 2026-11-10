import { createTheme, createToaster } from '@loidolt/theme-svelte';

/** The built-in presets `app.css` imports, default first. */
export const presets = ['loidolt', 'soft', 'compact'] as const;

export const theme = createTheme({ presets });
export const toaster = createToaster({ duration: 5000 });

/**
 * The screens, one per area. Paths are real (`/share`), so a deep link such as
 * `ldtexample://share` lands on one, and the TabBar's links work like any other link.
 */
export const screens = [
  { path: '/', label: 'Chrome' },
  { path: '/share', label: 'Share' },
  { path: '/files', label: 'Files' },
  { path: '/type', label: 'Type' },
  { path: '/system', label: 'System' },
] as const;

/** A tiny History API router: enough for a TabBar and deep links, no dependency. */
function createRouter() {
  const read = () =>
    typeof location === 'undefined'
      ? '/'
      : `${location.pathname}${location.search}${location.hash}`;
  let current = $state(read());
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => (current = read()));
    // Same-origin links go through the router; other-origin ones are left to the in-app browser.
    document.addEventListener('click', (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey) return;
      const anchor = (event.target as Element | null)?.closest?.('a[href]');
      if (
        !(anchor instanceof HTMLAnchorElement) ||
        anchor.target ||
        anchor.hasAttribute('download')
      )
        return;
      const url = new URL(anchor.href, location.href);
      if (url.origin !== location.origin) return;
      event.preventDefault();
      navigate(`${url.pathname}${url.search}${url.hash}`);
    });
  }
  function navigate(path: string) {
    if (path !== read()) {
      history.pushState(null, '', path);
      window.scrollTo(0, 0);
    }
    current = read();
    log('navigate', { path: current });
  }
  return {
    get path() {
      return current.split(/[?#]/)[0] || '/';
    },
    get full() {
      return current;
    },
    navigate,
  };
}

export const router = createRouter();

/**
 * Logs one line the iOS console shows (`xcrun simctl spawn booted log stream`), so a run can be
 * checked from the terminal as well as on screen.
 */
export function log(label: string, data?: unknown) {
  console.log(`[ldt] ${label}${data === undefined ? '' : ` ${JSON.stringify(data)}`}`);
}

/** `12.3 kB` */
export const size = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(1)} kB`;

/** A one-page PDF with a line of text: small, valid, and made on the spot. */
export function makePdf(text: string): Blob {
  const safe = text.replace(/[\\()]/g, (char) => `\\${char}`);
  const stream = `BT /F1 24 Tf 72 720 Td (${safe}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let body = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((object, index) => {
    offsets.push(body.length);
    body += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = body.length;
  body += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) body += `${String(offset).padStart(10, '0')} 00000 n \n`;
  body += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([body], { type: 'application/pdf' });
}

/** A second of a quiet looping tone as a WAV, for the media-pauses-in-the-background check. */
export function makeTone(): Blob {
  const rate = 8000;
  const samples = rate;
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);
  const ascii = (offset: number, value: string) =>
    [...value].forEach((char, i) => view.setUint8(offset + i, char.charCodeAt(0)));
  ascii(0, 'RIFF');
  view.setUint32(4, 36 + samples * 2, true);
  ascii(8, 'WAVEfmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, rate, true);
  view.setUint32(28, rate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  ascii(36, 'data');
  view.setUint32(40, samples * 2, true);
  for (let i = 0; i < samples; i++) {
    view.setInt16(44 + i * 2, Math.sin((2 * Math.PI * 440 * i) / rate) * 2000, true);
  }
  return new Blob([buffer], { type: 'audio/wav' });
}

/** The focused element, briefly: to check where focus lands after a native sheet closes. */
export function describeFocus(): string {
  const element = document.activeElement;
  if (!element || element === document.body) return 'body';
  const name = element.getAttribute('aria-label') ?? element.textContent?.trim().slice(0, 40);
  return `${element.tagName.toLowerCase()} "${name}"`;
}
