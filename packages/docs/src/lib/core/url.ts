/**
 * Whether a URL is safe to put in a link or image, and the URL if so. Relative URLs, fragments
 * and `http(s)`, `mailto` and `tel` pass; images also take raster `data:` URLs. Everything else —
 * `javascript:`, `vbscript:`, `data:text/html`, anything unfamiliar — is refused, since markdown
 * from anywhere but your own repository can carry it.
 */
export function safeUrl(url: string, kind: 'link' | 'image' = 'link'): string | null {
  // Browsers ignore control characters and whitespace inside a scheme; so must the check.
  const probe = [...url]
    .filter((char) => {
      const code = char.codePointAt(0)!;
      return code > 0x20 && (code < 0x7f || code > 0x9f);
    })
    .join('')
    .toLowerCase();
  const scheme = /^([a-z][a-z\d+.-]*):/.exec(probe)?.[1];
  if (!scheme) return url;
  if (['http', 'https'].includes(scheme)) return url;
  if (kind === 'link' && ['mailto', 'tel'].includes(scheme)) return url;
  if (kind === 'image' && /^data:image\/(png|jpe?g|gif|webp|avif);/.test(probe)) return url;
  return null;
}
