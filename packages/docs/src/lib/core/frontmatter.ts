/*
 * Frontmatter: the `---` block at the top of a markdown file. Parsed with a small, strict
 * subset of YAML — strings, numbers, booleans, null, lists and one level of nested maps —
 * which covers what documentation pages carry. Anything else is an error with its line
 * number, rather than a silent misreading. Pass `parseFrontmatter` to use a full YAML parser.
 */

export type FrontmatterValue =
  string | number | boolean | null | FrontmatterValue[] | { [key: string]: FrontmatterValue };

export type Frontmatter = Record<string, FrontmatterValue>;

/** Splits a leading `---` block from the body. */
export function splitFrontmatter(source: string): { frontmatter: string | null; body: string } {
  const match = /^\uFEFF?---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(source);
  return match
    ? { frontmatter: match[1], body: source.slice(match[0].length) }
    : { frontmatter: null, body: source };
}

function scalar(raw: string, line: number): FrontmatterValue {
  const value = raw.trim();
  if (value === '' || value === '~' || value === 'null') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(value)) return Number(value);
  if (/^"([^"\\]|\\.)*"$/.test(value)) {
    return JSON.parse(value) as string;
  }
  if (/^'([^']|'')*'$/.test(value)) return value.slice(1, -1).replace(/''/g, "'");
  if (value.startsWith('[')) {
    if (!value.endsWith(']')) throw new RangeError(`Frontmatter line ${line}: unclosed list`);
    const inner = value.slice(1, -1).trim();
    return inner ? splitList(inner, line).map((item) => scalar(item, line)) : [];
  }
  if (/^[{|>&*!%@`]/.test(value)) {
    throw new RangeError(`Frontmatter line ${line}: "${value[0]}" needs a full YAML parser`);
  }
  // A plain scalar ends at a comment.
  return value.replace(/\s+#.*$/, '');
}

/** Splits an inline list on commas outside quotes. */
function splitList(inner: string, line: number): string[] {
  const items: string[] = [];
  let current = '';
  let quote: string | null = null;
  for (const char of inner) {
    if (quote) {
      if (char === quote) quote = null;
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === ',') {
      items.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (quote) throw new RangeError(`Frontmatter line ${line}: unclosed quote`);
  return [...items, current];
}

/** Parses the YAML subset described above. Throws a `RangeError` naming the line. */
export function parseFrontmatter(text: string): Frontmatter {
  const lines = text.split(/\r?\n/);
  const root: Frontmatter = {};
  let parent: { key: string; kind: 'list' | 'map' | null } | null = null;

  lines.forEach((content, index) => {
    const line = index + 1;
    if (!content.trim() || /^\s*#/.test(content)) return;
    const indent = content.length - content.trimStart().length;
    const trimmed = content.trim();

    if (indent === 0) {
      const match = /^([^:#\s][^:]*?)\s*:(?:\s+(.*))?$/.exec(trimmed);
      if (!match) throw new RangeError(`Frontmatter line ${line}: expected "key: value"`);
      const [, key, rest] = match;
      if (rest === undefined || rest.trim() === '') {
        root[key] = null;
        parent = { key, kind: null };
      } else {
        root[key] = scalar(rest, line);
        parent = null;
      }
      return;
    }

    if (!parent) throw new RangeError(`Frontmatter line ${line}: indented, but under no key`);
    if (trimmed.startsWith('- ') || trimmed === '-') {
      if (parent.kind === 'map')
        throw new RangeError(`Frontmatter line ${line}: list item in a map`);
      parent.kind = 'list';
      const list = (root[parent.key] ??= []) as FrontmatterValue[];
      list.push(scalar(trimmed.slice(1), line));
      return;
    }
    const match = /^([^:#\s][^:]*?)\s*:(?:\s+(.*))?$/.exec(trimmed);
    if (!match || parent.kind === 'list') {
      throw new RangeError(`Frontmatter line ${line}: expected "key: value" or "- item"`);
    }
    parent.kind = 'map';
    const map = (root[parent.key] ??= {}) as Record<string, FrontmatterValue>;
    map[match[1]] = scalar(match[2] ?? '', line);
  });
  return root;
}
