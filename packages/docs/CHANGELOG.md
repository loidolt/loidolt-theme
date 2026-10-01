# @loidolt/theme-docs

## 0.8.0

### Patch Changes

- Updated dependencies [[`9673e33`](https://github.com/loidolt/loidolt-theme/commit/9673e33cc7b22cb4ff3a5ada2067785b08f191f4)]:
  - @loidolt/theme-tokens@0.8.0
  - @loidolt/theme-svelte@0.8.0

## 0.7.0

### Minor Changes

- [#10](https://github.com/loidolt/loidolt-theme/pull/10) [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b) Thanks [@loidolt](https://github.com/loidolt)! - New package: `@loidolt/theme-docs`, accessible Markdown documentation in the loidolt look.

  - `Markdown`, `MarkdownPage`, `CodeSnippet`, `MermaidDiagram`, `TableOfContents`, `TocPanel`, `DocsHub` and `DocsCard`.
  - `renderMarkdown` / `renderMarkdownSync` (in `@loidolt/theme-docs/core` too): GFM plus frontmatter, admonitions and GitHub alerts, footnotes, definition lists, filenames on code, and Mermaid fences; a table of contents with de-duplicated heading ids. Safe for untrusted markdown by default — raw HTML is shown as text and URLs are allow-listed — with `allowHtml` and a `sanitize` hook for trusted content.
  - Server-rendered first; Shiki highlighting and Mermaid diagrams are optional peers, registered with `setHighlighterLoader` and `setMermaidLoader`, and follow the theme.
  - Tokens: `--loidolt-syntax-*` colours for code on the inverse surface, each held to 4.5:1 in both themes, with `syntaxRoles` and `syntaxColors()`.
  - Styles: code frames, admonitions, footnotes, diagrams, contents, page layout and docs index in `@loidolt/theme-styles`.

### Patch Changes

- Updated dependencies [[`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b), [`dd2ffe2`](https://github.com/loidolt/loidolt-theme/commit/dd2ffe2262092dc2d775888fe57a04da739eab2b)]:
  - @loidolt/theme-tokens@0.7.0
  - @loidolt/theme-svelte@0.7.0
