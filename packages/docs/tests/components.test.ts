import { render, screen, waitFor, within } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import CodeSnippet from '../src/lib/components/CodeSnippet.svelte';
import DocsCard from '../src/lib/components/DocsCard.svelte';
import DocsHub from '../src/lib/components/DocsHub.svelte';
import Markdown from '../src/lib/components/Markdown.svelte';
import MarkdownPage from '../src/lib/components/MarkdownPage.svelte';
import MermaidDiagram from '../src/lib/components/MermaidDiagram.svelte';
import TableOfContents from '../src/lib/components/TableOfContents.svelte';
import TocPanel from '../src/lib/components/TocPanel.svelte';
import { renderMarkdownSync } from '../src/lib/core/render.js';
import { setHighlighterLoader } from '../src/lib/core/highlight.js';
import { setMermaidLoader } from '../src/lib/core/mermaid.js';

const fakeShiki = {
  createCssVariablesTheme: () => ({}),
  createHighlighter: async () => ({
    codeToHtml: (code: string) =>
      `<pre class="shiki"><code><span class="tok">${code}</span></code></pre>`,
    loadLanguage: async () => {},
    getLoadedLanguages: () => [],
  }),
};

const mermaid = {
  initialize: vi.fn(),
  render: vi.fn(async (id: string, source: string) => {
    if (source.includes('broken')) throw new Error('Parse error');
    return { svg: `<svg data-id="${id}"><text>${source.length}</text></svg>` };
  }),
};

let clipboard: { writeText: ReturnType<typeof vi.fn> };

beforeEach(() => {
  mermaid.initialize.mockClear();
  mermaid.render.mockClear();
  clipboard = { writeText: vi.fn(async () => {}) };
  Object.defineProperty(navigator, 'clipboard', { value: clipboard, configurable: true });
});

afterEach(() => vi.useRealTimers());

describe('Markdown', () => {
  const source = '# Guide\n\nSome **bold** text.\n\n```ts\nconst a = 1;\n```';

  it('renders in the first pass, as the server does, inside a prose article', () => {
    const { container } = render(Markdown, { source });
    const article = container.querySelector('article')!;
    expect(article).toHaveClass('ldt-prose', 'ldt-markdown');
    expect(screen.getByRole('heading', { level: 1, name: 'Guide' })).toBeInTheDocument();
    expect(article.querySelector('code.language-ts')).toHaveTextContent('const a = 1;');
  });

  it('upgrades to highlighted code once a highlighter answers, and reports each render', async () => {
    const onRender = vi.fn();
    const { container } = render(Markdown, {
      source,
      options: { highlight: (code: string) => `<span class="hl">${code}</span>` },
      onRender,
    });
    await waitFor(() => expect(container.querySelector('.hl')).not.toBeNull());
    expect(onRender).toHaveBeenCalledTimes(2);
    expect(onRender.mock.calls[1][0].highlighted).toBe(true);
  });

  it('uses a result it is given as is', () => {
    const result = { ...renderMarkdownSync('## Given'), html: '<p>Pre-rendered</p>' };
    render(Markdown, { result });
    expect(screen.getByText('Pre-rendered')).toBeInTheDocument();
  });

  it('copies code and says so, then puts the label back', async () => {
    render(Markdown, { source, copiedLabel: 'Copied!' });
    const button = screen.getByRole('button', { name: 'Copy' });
    await userEvent.click(button);
    expect(clipboard.writeText).toHaveBeenCalledWith('const a = 1;');
    expect(button).toHaveTextContent('Copied!');
    await waitFor(() => expect(document.querySelector('[aria-live]')).toHaveTextContent('Copied!'));
    await waitFor(() => expect(button).toHaveTextContent('Copy'), { timeout: 3000 });
  });

  it('stays quiet when the clipboard refuses', async () => {
    clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
    render(Markdown, { source });
    const button = screen.getByRole('button', { name: 'Copy' });
    await userEvent.click(button);
    expect(button).toHaveTextContent('Copy');
  });

  it('draws Mermaid diagrams as named pictures, keeping the source, and redraws on a theme change', async () => {
    setMermaidLoader(() => mermaid);
    const { container } = render(Markdown, {
      source: '```mermaid\ngraph TD; A-->B\n```\n\n```mermaid\nbroken\n```',
      diagramLabel: 'Flow',
      diagramSourceLabel: 'Source',
    });
    const picture = await screen.findByRole('img', { name: 'Flow' });
    expect(picture.querySelector('svg')).not.toBeNull();
    expect(within(container).getByText('Source')).toBeInTheDocument();
    // The broken diagram stays as its source.
    expect(container.querySelector('pre[data-ldt-mermaid]')).toHaveTextContent('broken');
    const calls = mermaid.render.mock.calls.length;
    document.documentElement.dataset.theme = 'dark';
    await waitFor(() => expect(mermaid.render.mock.calls.length).toBeGreaterThan(calls));
  });

  it('leaves diagram source readable when Mermaid is not there', async () => {
    const { container } = render(Markdown, { source: '```mermaid\ngraph TD; A-->B\n```' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.querySelector('pre[data-ldt-mermaid]')).toHaveTextContent('graph TD; A-->B');
  });
});

describe('CodeSnippet', () => {
  it('shows plain code, named, with a copy button', async () => {
    render(CodeSnippet, { code: 'npm i', lang: 'sh', highlight: false });
    const block = screen.getByLabelText('sh code');
    expect(block).toHaveAttribute('tabindex', '0');
    expect(block).toHaveTextContent('npm i');
    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));
    expect(clipboard.writeText).toHaveBeenCalledWith('npm i');
  });

  it('highlights with the registered loader and names itself by filename', async () => {
    setHighlighterLoader(() => fakeShiki);
    const { container } = render(CodeSnippet, {
      code: 'let x',
      lang: 'ts',
      filename: 'x.ts',
      copyable: false,
    });
    await waitFor(() => expect(container.querySelector('.tok')).toHaveTextContent('let x'));
    expect(screen.getByLabelText('x.ts')).toBeInTheDocument();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('stays plain when the highlighter declines', async () => {
    setHighlighterLoader(() => fakeShiki);
    const { container } = render(CodeSnippet, { code: 'words', label: 'Output' });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(container.querySelector('.tok')).toBeNull();
    expect(screen.getByLabelText('Output')).toHaveTextContent('words');
  });
});

describe('MermaidDiagram', () => {
  it('shows the source until drawn, then a named picture with the source behind a disclosure', async () => {
    let release: (value: unknown) => void = () => {};
    setMermaidLoader(() => new Promise((resolve) => (release = resolve)));
    render(MermaidDiagram, {
      code: 'graph TD; A-->B',
      label: 'Order flow',
      description: 'From A to B.',
    });
    expect(screen.getByText('graph TD; A-->B')).toBeInTheDocument();
    // The loader is only asked once the component has mounted and started drawing.
    await new Promise((resolve) => setTimeout(resolve, 0));
    release(mermaid);
    const picture = await screen.findByRole('img', { name: 'Order flow' });
    expect(picture).toHaveAccessibleDescription('From A to B.');
    expect(screen.getByText('Diagram source')).toBeInTheDocument();
  });

  it('keeps the source when the diagram does not parse', async () => {
    setMermaidLoader(() => mermaid);
    render(MermaidDiagram, { code: 'broken', label: 'Bad' });
    await waitFor(() => expect(mermaid.render).toHaveBeenCalled());
    expect(screen.getByText('broken')).toBeVisible();
    expect(screen.queryByRole('img')).toBeNull();
  });
});

describe('TableOfContents', () => {
  const items = [
    { id: 'intro', text: 'Intro', depth: 2 },
    { id: 'setup', text: 'Setup', depth: 3 },
    { id: 'usage', text: 'Usage', depth: 2 },
  ];
  let callback: (entries: Array<{ target: Element; isIntersecting: boolean }>) => void = () => {};
  const disconnect = vi.fn();

  beforeEach(() => {
    disconnect.mockClear();
    globalThis.IntersectionObserver = class {
      constructor(cb: typeof callback) {
        callback = cb;
      }
      observe() {}
      disconnect = disconnect;
      unobserve() {}
    } as unknown as typeof IntersectionObserver;
    document.body.insertAdjacentHTML(
      'beforeend',
      '<main id="doc"><h2 id="intro">Intro</h2><h3 id="setup">Setup</h3><h2 id="usage">Usage</h2></main>'
    );
  });

  afterEach(() => document.getElementById('doc')?.remove());

  it('lists the headings, indented by depth, and marks the one being read', async () => {
    const { unmount } = render(TableOfContents, {
      items,
      container: document.getElementById('doc'),
    });
    const nav = screen.getByRole('navigation', { name: 'On this page' });
    const links = within(nav).getAllByRole('link');
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#intro', '#setup', '#usage']);
    expect(links[1].closest('li')).toHaveStyle('--ldt-toc-level: 1');

    callback([{ target: document.getElementById('setup')!, isIntersecting: true }]);
    await waitFor(() => expect(links[1]).toHaveAttribute('aria-current', 'location'));
    // Between headings, the last one stays current.
    callback([{ target: document.getElementById('setup')!, isIntersecting: false }]);
    await new Promise((resolve) => setTimeout(resolve, 10));
    expect(links[1]).toHaveAttribute('aria-current', 'location');
    unmount();
    expect(disconnect).toHaveBeenCalled();
  });

  it('marks and reports a followed link', async () => {
    const onNavigate = vi.fn();
    render(TableOfContents, { items, title: 'Contents', onNavigate });
    const link = screen.getByRole('link', { name: 'Usage' });
    await userEvent.click(link);
    expect(link).toHaveAttribute('aria-current', 'location');
    expect(onNavigate).toHaveBeenCalledWith(items[2]);
  });
});

describe('TocPanel', () => {
  it('renders the side list and a drawer that closes when a link is followed', async () => {
    const items = [{ id: 'one', text: 'One', depth: 2 }];
    const { container } = render(TocPanel, { items, openLabel: 'Contents' });
    expect(container.querySelector('.ldt-toc-panel__wide nav')).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Contents' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('link', { name: 'One' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});

describe('docs index', () => {
  it('lays out sections of card links, one heading level below the section', () => {
    render(DocsHub, {
      headingLevel: 3,
      sections: [
        {
          title: 'Guides',
          description: 'Start here.',
          items: [
            {
              title: 'Install',
              href: '/install',
              description: 'Add the packages.',
              eyebrow: 'Setup',
            },
            { title: 'Source', href: 'https://github.com/x', external: true },
          ],
        },
      ],
    });
    expect(screen.getByRole('heading', { level: 3, name: 'Guides' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'Install' })).toBeInTheDocument();
    const install = screen.getByRole('link', { name: /Install/ });
    expect(install).toHaveAttribute('href', '/install');
    expect(install).toHaveTextContent('Setup');
    const source = screen.getByRole('link', { name: /Source/ });
    expect(source).toHaveAttribute('target', '_blank');
    expect(source).toHaveAccessibleName(/opens in a new tab/);
    expect(screen.getByText('Start here.')).toBeInTheDocument();
  });

  it('renders a single card with extra content', () => {
    render(DocsCard, { title: 'Tokens', href: '/tokens' });
    expect(screen.getByRole('link', { name: 'Tokens' })).not.toHaveAttribute('target');
  });
});

describe('MarkdownPage', () => {
  const page =
    '---\ndescription: How to begin.\neyebrow: Guide\n---\n# Getting started\n\nIntro.\n\n## Install\n\n## Configure';

  it('shows one level-1 heading, from the document, with its frontmatter and contents', () => {
    const { container } = render(MarkdownPage, {
      source: page,
      previous: { title: 'Home', href: '/' },
      next: { title: 'Tokens', href: '/tokens' },
    });
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'Getting started' })).toBeInTheDocument();
    expect(screen.getByText('How to begin.')).toBeInTheDocument();
    expect(screen.getByText('Guide')).toBeInTheDocument();
    expect(container.querySelector('.ldt-markdown-page--toc')).not.toBeNull();
    expect(screen.getByRole('navigation', { name: 'On this page' })).toHaveTextContent('Install');
    const pager = screen.getByRole('navigation', { name: 'More pages' });
    expect(within(pager).getByRole('link', { name: /Previous\s*Home/ })).toHaveAttribute(
      'rel',
      'prev'
    );
    expect(within(pager).getByRole('link', { name: /Next\s*Tokens/ })).toHaveAttribute(
      'rel',
      'next'
    );
  });

  it('takes a title of its own, and can go without contents', () => {
    const { container } = render(MarkdownPage, {
      source: 'Just text.',
      title: 'Notes',
      toc: false,
    });
    expect(screen.getByRole('heading', { level: 1, name: 'Notes' })).toBeInTheDocument();
    expect(container.querySelector('.ldt-toc')).toBeNull();
  });

  it('renders a result it is given', () => {
    const result = renderMarkdownSync('# Given\n\n## Part', { stripTitle: true });
    render(MarkdownPage, { result });
    expect(screen.getByRole('heading', { level: 1, name: 'Given' })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });
});
