import type { Frontmatter } from './frontmatter.js';

/** One heading, for a table of contents. */
export interface TocItem {
  id: string;
  /** The heading's text, without markup. */
  text: string;
  /** 1 for `#`, 2 for `##`, … */
  depth: number;
}

/** What rendering a markdown document produces. */
export interface RenderedMarkdown {
  html: string;
  /** The headings a table of contents should list (see `tocDepth`). */
  toc: TocItem[];
  /** Every heading, at any depth. */
  headings: TocItem[];
  frontmatter: Frontmatter | null;
  /** The frontmatter `title`, else the first level-1 heading. */
  title: string | null;
  /** Whether code blocks were syntax-highlighted. */
  highlighted: boolean;
}

/** Highlights one block of code, returning the HTML to go inside its `<code>`, or `null` to leave it plain. */
export type HighlightFunction = (
  code: string,
  lang: string
) => Promise<string | null> | string | null;

export type AdmonitionKind = 'note' | 'tip' | 'important' | 'warning' | 'caution';

export interface MarkdownOptions {
  /**
   * Pass raw HTML in the markdown through. Off by default, when it is shown as text: turn it on
   * only for markdown you wrote, or with a `sanitize` hook.
   */
  allowHtml?: boolean;
  /** Runs last, on the finished HTML — plug a sanitizer such as DOMPurify in here. */
  sanitize?: (html: string) => string;
  /** Prepended to every generated id, so two documents on one page cannot collide. */
  idPrefix?: string;
  /** Make each heading a link to itself, for sharing a section. */
  headingLinks?: boolean;
  /**
   * Leave the first `#` heading out of the HTML (it is still the `title` and in `headings`) —
   * for a page that shows the title itself, as `MarkdownPage` does.
   */
  stripTitle?: boolean;
  /** The heading depths the table of contents lists. Defaults to `[2, 3]`. */
  tocDepth?: [number, number];
  /**
   * Highlight code blocks. Defaults to the registered Shiki loader when there is one
   * (`setHighlighterLoader`); `false` never highlights; or pass your own function.
   */
  highlight?: boolean | HighlightFunction;
  /** Replace the built-in frontmatter parser, e.g. with a full YAML library. */
  parseFrontmatter?: (text: string) => Frontmatter;
  /** Headings for admonitions, by kind. */
  admonitionLabels?: Partial<Record<AdmonitionKind, string>>;
  copyLabel?: string;
  /** Names a code block for assistive tech. */
  codeLabel?: (lang: string) => string;
  /** How a task list's checkboxes are named: done, and not yet done. */
  taskLabels?: { done: string; open: string };
  footnotesLabel?: string;
  footnoteBackLabel?: (number: number) => string;
}

/** A page in a docs index. */
export interface DocsItem {
  title: string;
  href: string;
  description?: string;
  eyebrow?: string;
  external?: boolean;
}

/** A group of pages in a docs index. */
export interface DocsSection {
  title: string;
  description?: string;
  items: DocsItem[];
}

/** A neighbouring page, for previous and next links. */
export interface DocsLink {
  title: string;
  href: string;
}
