import { render } from 'svelte/server';
import { describe, expect, it } from 'vitest';
import * as lib from '../../src/lib/index.js';

/**
 * Server-renders every component. The document itself — headings, code, footnotes, the table of
 * contents — is in the server's HTML; only highlighting and diagrams arrive in the browser.
 */
const page = '# Title\n\nBody with `code`.\n\n## Part one\n\n```ts\nconst a = 1;\n```';

const cases: Array<[keyof typeof lib, Record<string, unknown>, string]> = [
  ['Markdown', { source: page }, '<code class="language-ts">const a = 1;</code>'],
  ['MarkdownPage', { source: page }, 'Part one'],
  ['CodeSnippet', { code: 'npm i', lang: 'sh' }, 'npm i'],
  ['MermaidDiagram', { code: 'graph TD; A-->B', label: 'Flow' }, 'graph TD; A--'],
  ['TableOfContents', { items: [{ id: 'a', text: 'Alpha', depth: 2 }] }, 'Alpha'],
  ['TocPanel', { items: [{ id: 'a', text: 'Alpha', depth: 2 }] }, 'Alpha'],
  [
    'DocsHub',
    { sections: [{ title: 'Guides', items: [{ title: 'Start', href: '/start' }] }] },
    'Start',
  ],
  ['DocsCard', { title: 'Tokens', href: '/tokens' }, 'Tokens'],
];

describe('server rendering', () => {
  it('covers every exported component', () => {
    const components = Object.keys(lib).filter((name) => /^[A-Z][a-z]/.test(name));
    expect(cases.map(([name]) => name).sort()).toEqual(components.sort());
  });

  it.each(cases)('%s renders on the server', (name, props, expected) => {
    const { body } = render(lib[name] as never, { props: props as never });
    expect(body).toContain(expected);
  });

  it('renders and highlights markdown in Node', async () => {
    const result = await lib.renderMarkdown(page, {
      highlight: (code) => `<span class="server">${code}</span>`,
    });
    expect(result.html).toContain('<span class="server">const a = 1;</span>');
    expect(result.toc).toEqual([{ id: 'part-one', text: 'Part one', depth: 2 }]);
  });
});
