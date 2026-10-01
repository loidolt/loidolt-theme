const ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/** Text made safe to place in HTML, as content or inside a quoted attribute. */
export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => ENTITIES[char]);

/** HTML entities back to text — for turning rendered heading HTML into plain text. */
export const decodeEntities = (value: string) =>
  value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(parseInt(code, 16)))
    .replace(
      /&(amp|lt|gt|quot|apos|nbsp);/g,
      (_, name: string) =>
        ({ amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' })[name] ?? ''
    );

/** The text of an HTML fragment, tags dropped and entities decoded. */
export const textOf = (html: string) => decodeEntities(html.replace(/<[^>]*>/g, '')).trim();
