/*
 * The registry notes and prop docs are plain strings, not markdown — a full parser would be a
 * dependency and an XSS surface for the sake of one construct. Backticks mark inline code, and
 * `\`` is a literal backtick, as a doc comment writes one inside code: `(v) => \`${v} mm\``.
 */
export interface RichTextPart {
  text: string;
  code: boolean;
}

export function parseRichText(value: string): RichTextPart[] {
  const parts: RichTextPart[] = [{ text: '', code: false }];
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === '\\' && value[index + 1] === '`') {
      parts[parts.length - 1].text += '`';
      index++;
    } else if (char === '`') {
      parts.push({ text: '', code: !parts[parts.length - 1].code });
    } else {
      parts[parts.length - 1].text += char;
    }
  }
  return parts.filter((part) => part.text);
}

/** The same string as text alone, for a slot that takes no markup. */
export const plainText = (value: string) =>
  parseRichText(value)
    .map((part) => part.text)
    .join('');
