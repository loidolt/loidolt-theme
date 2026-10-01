import { Marked, type Token, type TokenizerAndRendererExtension } from 'marked';
import { escapeHtml, textOf } from './escape.js';
import {
  parseFrontmatter as parseSubset,
  splitFrontmatter,
  type Frontmatter,
} from './frontmatter.js';
import { loadHighlighter } from './highlight.js';
import { createSlugger } from './slug.js';
import type {
  AdmonitionKind,
  HighlightFunction,
  MarkdownOptions,
  RenderedMarkdown,
  TocItem,
} from './types.js';
import { safeUrl } from './url.js';

const ADMONITION_TONES: Record<AdmonitionKind, 'info' | 'success' | 'warning' | 'error'> = {
  note: 'info',
  tip: 'success',
  important: 'info',
  warning: 'warning',
  caution: 'error',
};

const DEFAULT_ADMONITION_LABELS: Record<AdmonitionKind, string> = {
  note: 'Note',
  tip: 'Tip',
  important: 'Important',
  warning: 'Warning',
  caution: 'Caution',
};

/** Marks where a code block's HTML goes, once highlighting (or not) has decided what it is. */
// Private-use characters: they cannot occur in rendered markdown, which escapes nothing into them.
const CODE_MARK = (index: number) => `\uE000ldt-code-${index}\uE001`;

interface CodeBlock {
  text: string;
  lang: string;
}

interface Parsed {
  html: string;
  codes: CodeBlock[];
  headings: TocItem[];
  frontmatter: Frontmatter | null;
}

/** Splits a fence's info string: ```ts title="app.ts"``` or ```ts:app.ts```. */
function fenceInfo(info: string): { lang: string; filename: string | null } {
  const [first = '', ...rest] = info.trim().split(/\s+/);
  const [lang, colonName] = first.split(':');
  const titled = /(?:title|filename)=(?:"([^"]*)"|'([^']*)'|(\S+))/.exec(rest.join(' '));
  return {
    lang: lang ?? '',
    filename: titled?.[1] ?? titled?.[2] ?? titled?.[3] ?? colonName ?? null,
  };
}

function parse(source: string, options: MarkdownOptions): Parsed {
  const {
    allowHtml = false,
    idPrefix = '',
    headingLinks = true,
    stripTitle = false,
    admonitionLabels = {},
    copyLabel = 'Copy',
    codeLabel = (lang: string) => (lang ? `${lang} code` : 'Code'),
    taskLabels = { done: 'Done', open: 'Not done' },
    footnotesLabel = 'Footnotes',
    footnoteBackLabel = (number: number) => `Back to reference ${number}`,
  } = options;

  const { frontmatter: rawFrontmatter, body } = splitFrontmatter(source);
  const frontmatter =
    rawFrontmatter === null ? null : (options.parseFrontmatter ?? parseSubset)(rawFrontmatter);

  // Every call gets its own state: nothing is shared between documents, even concurrently.
  const slug = createSlugger(idPrefix);
  const headings: TocItem[] = [];
  const codes: CodeBlock[] = [];
  const footnoteDefinitions = new Map<string, Token[]>();
  const footnoteNumbers = new Map<string, number>();
  const footnoteHtml = new Map<string, string>();

  const admonition: TokenizerAndRendererExtension = {
    name: 'admonition',
    level: 'block',
    start: (src) => src.match(/^(:::|> ?\[!)/m)?.index,
    tokenizer(src) {
      const fenced =
        /^:::[ \t]*(note|tip|important|warning|caution)(?:[ \t]+([^\n]*))?\n([\s\S]*?)\n:::[ \t]*(?:\n|$)/i.exec(
          src
        );
      const alert =
        /^> ?\[!(note|tip|important|warning|caution)\][ \t]*\n((?:>[^\n]*(?:\n|$))*)/i.exec(src);
      const match = fenced ?? alert;
      if (!match) return undefined;
      const kind = match[1].toLowerCase() as AdmonitionKind;
      const title = fenced ? (fenced[2]?.trim() ?? '') : '';
      const content = fenced ? fenced[3] : alert![2].replace(/^> ?/gm, '');
      return {
        type: 'admonition',
        raw: match[0],
        kind,
        titleTokens: title ? this.lexer.inlineTokens(title) : [],
        tokens: this.lexer.blockTokens(content, []),
      };
    },
    childTokens: ['titleTokens'],
    renderer(token) {
      const kind = token.kind as AdmonitionKind;
      const title = token.titleTokens.length
        ? this.parser.parseInline(token.titleTokens)
        : escapeHtml(admonitionLabels[kind] ?? DEFAULT_ADMONITION_LABELS[kind]);
      return `<div class="ldt-alert ldt-alert--${ADMONITION_TONES[kind]} ldt-admonition" data-kind="${kind}" role="note"><p class="ldt-alert__title">${title}</p><div class="ldt-alert__description">${this.parser.parse(token.tokens!)}</div></div>\n`;
    },
  };

  const footnoteDefinition: TokenizerAndRendererExtension = {
    name: 'footnoteDefinition',
    level: 'block',
    start: (src) => src.match(/^\[\^[^\]\s]+\]:/m)?.index,
    tokenizer(src) {
      const match = /^\[\^([^\]\s]+)\]:[ \t]*([^\n]*(?:\n(?: {2,}|\t)[^\n]*)*)(?:\n|$)/.exec(src);
      if (!match) return undefined;
      const tokens = this.lexer.inlineTokens(match[2].replace(/\n\s+/g, ' '));
      if (!footnoteDefinitions.has(match[1])) footnoteDefinitions.set(match[1], tokens);
      return { type: 'footnoteDefinition', raw: match[0], id: match[1], tokens };
    },
    renderer(token) {
      footnoteHtml.set(token.id, this.parser.parseInline(token.tokens!));
      return '';
    },
  };

  const footnoteReference: TokenizerAndRendererExtension = {
    name: 'footnoteReference',
    level: 'inline',
    start: (src) => src.indexOf('[^'),
    tokenizer(src) {
      const match = /^\[\^([^\]\s]+)\](?!:)/.exec(src);
      return match ? { type: 'footnoteReference', raw: match[0], id: match[1] } : undefined;
    },
    renderer(token) {
      const id = token.id as string;
      if (!footnoteDefinitions.has(id)) return escapeHtml(token.raw);
      let number = footnoteNumbers.get(id);
      if (number === undefined) {
        number = footnoteNumbers.size + 1;
        footnoteNumbers.set(id, number);
      }
      const safe = escapeHtml(slugOf(id));
      return `<sup class="ldt-footnote-ref"><a id="${escapeHtml(idPrefix)}fnref-${safe}" href="#${escapeHtml(idPrefix)}fn-${safe}" aria-describedby="${escapeHtml(idPrefix)}footnotes-label">${number}</a></sup>`;
    },
  };

  const definitionList: TokenizerAndRendererExtension = {
    name: 'definitionList',
    level: 'block',
    start: (src) => src.match(/^[^\n]+\n:[ \t]/m)?.index,
    tokenizer(src) {
      const match = /^([^\n#>*+\-|`:\s][^\n]*)\n((?::[ \t]+[^\n]*(?:\n|$))+)/.exec(src);
      if (!match || /^\d+[.)]\s/.test(match[1])) return undefined;
      const definitions = match[2]
        .split('\n')
        .filter((line) => line.startsWith(':'))
        .map((line) => this.lexer.inlineTokens(line.replace(/^:[ \t]+/, '')));
      return {
        type: 'definitionList',
        raw: match[0],
        term: this.lexer.inlineTokens(match[1]),
        definitions,
      };
    },
    childTokens: ['term'],
    renderer(token) {
      const definitions = (token.definitions as Token[][])
        .map((tokens) => `<dd>${this.parser.parseInline(tokens)}</dd>`)
        .join('');
      return `<dl><dt>${this.parser.parseInline(token.term)}</dt>${definitions}</dl>\n`;
    },
  };

  /** A footnote id made safe for an HTML id and a URL fragment. */
  const slugOf = (id: string) => id.replace(/[^\p{L}\p{N}_-]/gu, '-');

  const marked = new Marked({
    gfm: true,
    async: false,
    extensions: [admonition, footnoteDefinition, footnoteReference, definitionList],
    renderer: {
      heading({ tokens, depth }) {
        const inner = this.parser.parseInline(tokens);
        const text = textOf(inner);
        const id = slug(text);
        const isTitle =
          stripTitle && depth === 1 && !headings.some((heading) => heading.depth === 1);
        headings.push({ id, text, depth });
        if (isTitle) return '';
        const content = headingLinks
          ? `<a class="ldt-heading-anchor" href="#${escapeHtml(id)}">${inner}</a>`
          : inner;
        return `<h${depth} id="${escapeHtml(id)}">${content}</h${depth}>\n`;
      },
      code({ text, lang }) {
        const { lang: language, filename } = fenceInfo(lang ?? '');
        if (language === 'mermaid') {
          // The source, until `Markdown` turns it into a picture; readable if it never does.
          return `<pre class="ldt-mermaid" data-ldt-mermaid>${escapeHtml(text)}</pre>\n`;
        }
        codes.push({ text, lang: language });
        const header = `<figcaption class="ldt-code__header">${filename ? `<span class="ldt-code__filename">${escapeHtml(filename)}</span>` : ''}<button type="button" class="ldt-code__copy" data-ldt-copy>${escapeHtml(copyLabel)}</button></figcaption>`;
        return `<figure class="ldt-code"${language ? ` data-lang="${escapeHtml(language)}"` : ''}>${header}<pre class="ldt-code__pre" tabindex="0" aria-label="${escapeHtml(filename ?? codeLabel(language))}"><code${language ? ` class="language-${escapeHtml(language)}"` : ''}>${CODE_MARK(codes.length - 1)}</code></pre></figure>\n`;
      },
      html({ text }) {
        return allowHtml ? text : escapeHtml(text);
      },
      link({ href, title, tokens }) {
        const inner = this.parser.parseInline(tokens);
        let url = safeUrl(href, 'link');
        if (url === null) return `<span class="ldt-unsafe-link">${inner}</span>`;
        // Authors link to headings by their plain slug; with a prefix, the ids carry it too.
        if (idPrefix && url.startsWith('#') && !url.startsWith(`#${idPrefix}`)) {
          url = `#${idPrefix}${url.slice(1)}`;
        }
        const external = /^https?:\/\//i.test(url);
        return `<a href="${escapeHtml(url)}"${title ? ` title="${escapeHtml(title)}"` : ''}${external ? ' rel="noopener"' : ''}>${inner}</a>`;
      },
      image({ href, title, text }) {
        const url = safeUrl(href, 'image');
        if (url === null) return escapeHtml(text);
        return `<img src="${escapeHtml(url)}" alt="${escapeHtml(text)}"${title ? ` title="${escapeHtml(title)}"` : ''} loading="lazy">`;
      },
      checkbox({ checked }) {
        return `<input type="checkbox" disabled${checked ? ' checked' : ''} aria-label="${escapeHtml(checked ? taskLabels.done : taskLabels.open)}"> `;
      },
    },
  });

  let html = marked.parse(body) as string;

  if (footnoteNumbers.size) {
    const items = [...footnoteNumbers.entries()]
      .sort(([, a], [, b]) => a - b)
      .map(([id, number]) => {
        const safe = escapeHtml(slugOf(id));
        return `<li id="${escapeHtml(idPrefix)}fn-${safe}">${footnoteHtml.get(id) ?? ''} <a class="ldt-footnote-back" href="#${escapeHtml(idPrefix)}fnref-${safe}" aria-label="${escapeHtml(footnoteBackLabel(number))}">↩</a></li>`;
      })
      .join('');
    html += `<section class="ldt-footnotes" aria-labelledby="${escapeHtml(idPrefix)}footnotes-label"><h2 class="ldt-sr-only" id="${escapeHtml(idPrefix)}footnotes-label">${escapeHtml(footnotesLabel)}</h2><ol>${items}</ol></section>\n`;
  }

  return { html, codes, headings, frontmatter };
}

function finish(
  parsed: Parsed,
  codeHtml: Array<string | null>,
  options: MarkdownOptions
): RenderedMarkdown {
  const [min, max] = options.tocDepth ?? [2, 3];
  let html = parsed.html.replace(/\uE000ldt-code-(\d+)\uE001/g, (_, index: string) => {
    const code = parsed.codes[Number(index)];
    return codeHtml[Number(index)] ?? escapeHtml(code.text);
  });
  if (options.sanitize) html = options.sanitize(html);
  const title = parsed.frontmatter?.title;
  return {
    html,
    toc: parsed.headings.filter((heading) => heading.depth >= min && heading.depth <= max),
    headings: parsed.headings,
    frontmatter: parsed.frontmatter,
    title:
      typeof title === 'string'
        ? title
        : (parsed.headings.find((heading) => heading.depth === 1)?.text ?? null),
    highlighted: codeHtml.some((code) => code !== null),
  };
}

/**
 * Renders markdown without syntax highlighting — synchronous, for a first render or wherever
 * nothing can be awaited. Code blocks are escaped plain text in the same frame.
 */
export function renderMarkdownSync(
  source: string,
  options: MarkdownOptions = {}
): RenderedMarkdown {
  const parsed = parse(source, options);
  return finish(
    parsed,
    parsed.codes.map(() => null),
    options
  );
}

/**
 * Renders markdown to HTML with a table of contents, frontmatter and highlighted code. Safe for
 * untrusted markdown by default: raw HTML is shown as text, and links and images only keep
 * safe URLs. Works on the server — await it in a SvelteKit `load` to prerender pages.
 */
export async function renderMarkdown(
  source: string,
  options: MarkdownOptions = {}
): Promise<RenderedMarkdown> {
  const parsed = parse(source, options);
  let highlight: HighlightFunction | null = null;
  if (typeof options.highlight === 'function') highlight = options.highlight;
  else if (options.highlight !== false) highlight = await loadHighlighter();
  const codeHtml = highlight
    ? await Promise.all(
        parsed.codes.map(async ({ text, lang }) => {
          try {
            return (await highlight!(text, lang)) ?? null;
          } catch {
            return null;
          }
        })
      )
    : parsed.codes.map(() => null);
  return finish(parsed, codeHtml, options);
}
