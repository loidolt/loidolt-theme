import { render, screen } from '@testing-library/svelte';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';
import * as docs from '../src/lib/index.js';

const everything = `---
title: Kitchen sink
---
# Kitchen sink

Text with a [link](/x), \`code\`, a footnote[^1] and <b>escaped HTML</b>.

## Lists

- [x] Done
- [ ] Not done

Term
: Definition

:::warning Careful
Body.
:::

> [!TIP]
> A tip.

| Name | Value |
| ---- | ----: |
| A    |     1 |

\`\`\`ts title="example.ts"
const a = 1;
\`\`\`

\`\`\`mermaid
graph TD; A-->B
\`\`\`

[^1]: The note.
`;

describe('docs accessibility', () => {
  it('renders every markdown feature without axe violations', async () => {
    const { container } = render(docs.Markdown, { source: everything });
    expect((await axe(container)).violations).toEqual([]);
  });

  it('passes axe as a full page, with contents and pager', async () => {
    globalThis.IntersectionObserver = class {
      observe() {}
      disconnect() {}
      unobserve() {}
    } as unknown as typeof IntersectionObserver;
    const { container } = render(docs.MarkdownPage, {
      source: everything,
      previous: { title: 'Home', href: '/' },
      next: { title: 'Next', href: '/next' },
    });
    expect((await axe(container)).violations).toEqual([]);
  });

  it('passes axe for snippets, diagrams and the docs index', async () => {
    for (const [Component, props] of [
      [docs.CodeSnippet, { code: 'npm i', lang: 'sh', filename: 'install.sh' }],
      [docs.MermaidDiagram, { code: 'graph TD; A-->B', label: 'Flow', description: 'A to B.' }],
      [
        docs.DocsHub,
        {
          sections: [
            { title: 'Guides', items: [{ title: 'Start', href: '/start', description: 'Begin.' }] },
          ],
        },
      ],
      [docs.TableOfContents, { items: [{ id: 'a', text: 'A', depth: 2 }] }],
    ] as const) {
      const { container, unmount } = render(Component as never, props as never);
      expect((await axe(container)).violations).toEqual([]);
      unmount();
    }
  });

  it('keeps code blocks reachable by keyboard', () => {
    render(docs.Markdown, { source: '```js\nconst x = 1;\n```' });
    expect(screen.getByLabelText('js code')).toHaveAttribute('tabindex', '0');
    vi.restoreAllMocks();
  });
});
