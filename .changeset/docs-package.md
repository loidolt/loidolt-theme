---
'@loidolt/theme-docs': minor
'@loidolt/theme-styles': minor
'@loidolt/theme-tokens': minor
---

New package: `@loidolt/theme-docs`, accessible Markdown documentation in the loidolt look.

- `Markdown`, `MarkdownPage`, `CodeSnippet`, `MermaidDiagram`, `TableOfContents`, `TocPanel`, `DocsHub` and `DocsCard`.
- `renderMarkdown` / `renderMarkdownSync` (in `@loidolt/theme-docs/core` too): GFM plus frontmatter, admonitions and GitHub alerts, footnotes, definition lists, filenames on code, and Mermaid fences; a table of contents with de-duplicated heading ids. Safe for untrusted markdown by default — raw HTML is shown as text and URLs are allow-listed — with `allowHtml` and a `sanitize` hook for trusted content.
- Server-rendered first; Shiki highlighting and Mermaid diagrams are optional peers, registered with `setHighlighterLoader` and `setMermaidLoader`, and follow the theme.
- Tokens: `--loidolt-syntax-*` colours for code on the inverse surface, each held to 4.5:1 in both themes, with `syntaxRoles` and `syntaxColors()`.
- Styles: code frames, admonitions, footnotes, diagrams, contents, page layout and docs index in `@loidolt/theme-styles`.
