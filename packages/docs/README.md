# @loidolt/theme-docs

Accessible Markdown documentation for Svelte 5, in the Loidolt look: pages, contents, code and
diagrams.

- **Safe by default.** Raw HTML in markdown is shown as text, links and images keep only safe
  URLs, and every extension escapes what it writes. Markdown from a CMS or a pull request cannot
  put a script on your page unless you let it (`allowHtml`, ideally with a `sanitize` hook).
- **Server-rendered.** The whole document — headings, tables, footnotes, the table of contents —
  is in the first render, so pages prerender with their content and search engines see it.
  Highlighting and diagrams arrive in the browser, or render on the server with
  `renderMarkdown` in a `load`.
- **Themed.** Rendered markdown takes `.ldt-prose`. Code is highlighted with Shiki's
  CSS-variables theme mapped to the `--loidolt-syntax-*` tokens, so it follows light and dark
  without a second pass; Mermaid diagrams are drawn in the theme's colours and redrawn when it
  changes.
- **Accessible.** One level-1 heading per page; headings link to themselves; code blocks are
  named and keyboard-reachable; task-list checkboxes, footnotes and diagrams all carry names.

## Install

```sh
npm install @loidolt/theme-docs
# optional: highlighting and diagrams
npm install shiki mermaid
```

The docs styles ship with `@loidolt/theme-styles`. Register the optional pieces once:

```ts
import { setHighlighterLoader, setMermaidLoader } from '@loidolt/theme-docs';

setHighlighterLoader(() => import('shiki'));
setMermaidLoader(() => import('mermaid').then((module) => module.default));
```

Without them, code is plain and diagrams show their source — nothing breaks.

```svelte
<script lang="ts">
  import { MarkdownPage } from '@loidolt/theme-docs';
  let { data } = $props();
</script>

<MarkdownPage source={data.markdown} next={{ title: 'Tokens', href: '/docs/tokens' }} />
```

## Components

| Component         | What it is                                                                   |
| ----------------- | ---------------------------------------------------------------------------- |
| `Markdown`        | A markdown document as loidolt prose, with highlighting, diagrams and copy   |
| `MarkdownPage`    | A full page: title and description from frontmatter, contents, previous/next |
| `CodeSnippet`     | One highlighted code block with a filename and copy button                   |
| `MermaidDiagram`  | A diagram as a named picture with a description and its source               |
| `TableOfContents` | A page's headings, marking the one being read                                |
| `TocPanel`        | Contents beside the page, or behind a button on narrow screens               |
| `DocsHub`         | An index of pages in sections                                                |
| `DocsCard`        | One page in an index; the whole card is the link                             |

## Markdown

GitHub-flavoured markdown (tables, task lists, strikethrough, autolinks), plus:

- **Frontmatter** in a leading `---` block: strings, numbers, booleans, lists and one level of
  maps, parsed strictly (errors name the line). `parseFrontmatter` takes a full YAML parser.
- **Admonitions**: `:::note|tip|important|warning|caution [title]` … `:::`, and GitHub's
  `> [!NOTE]` alerts, rendered in the alert tones as notes.
- **Footnotes**: `text[^id]` and `[^id]: note`, numbered by first use, linked both ways.
- **Definition lists**: a term line followed by `: definition` lines.
- **Code**: ` ```ts title="file.ts" ` (or ` ```ts:file.ts `) adds a filename.
- **Diagrams**: ` ```mermaid ` fences.

### Rendering ahead of time

```ts
// +page.server.ts
import { renderMarkdown } from '@loidolt/theme-docs/core';
import { createShikiHighlight } from '@loidolt/theme-docs/core';
import * as shiki from 'shiki';

export async function load() {
  const result = await renderMarkdown(source, {
    stripTitle: true,
    highlight: createShikiHighlight(shiki),
  });
  return { result };
}
```

```svelte
<MarkdownPage result={data.result} />
```

`renderMarkdown` returns `{ html, toc, headings, frontmatter, title, highlighted }`.
`renderMarkdownSync` does the same without highlighting. Options include `allowHtml`,
`sanitize`, `idPrefix` (for two documents on one page), `headingLinks`, `tocDepth`,
`stripTitle` and every user-facing string (`admonitionLabels`, `copyLabel`, `codeLabel`,
`taskLabels`, `footnotesLabel`, `footnoteBackLabel`).

## License

MIT
