import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createShikiHighlight,
  createSlugger,
  decodeEntities,
  escapeHtml,
  loadHighlighter,
  loadMermaid,
  parseFrontmatter,
  renderMarkdown,
  renderMarkdownSync,
  renderMermaid,
  safeUrl,
  setHighlighterLoader,
  setMermaidLoader,
  slugify,
  splitFrontmatter,
  textOf,
} from '../src/lib/core/index.js';

afterEach(() => {
  setHighlighterLoader(null);
  setMermaidLoader(null);
});

const render = (source: string, options = {}) => renderMarkdownSync(source, options).html;

describe('escaping and URLs', () => {
  it('escapes and decodes', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;'
    );
    expect(decodeEntities('&lt;b&gt; &amp; &#65;&#x42; &quot;&apos;&nbsp;&bogus;')).toBe(
      `<b> & AB "' &bogus;`
    );
    expect(textOf('<em>Hi</em> &amp; <code>bye</code>')).toBe('Hi & bye');
  });

  it('keeps safe URLs and refuses the rest', () => {
    for (const url of [
      '/docs',
      './a',
      '../b',
      '#top',
      '?q=1',
      'page.html',
      'https://x.test',
      'HTTP://x.test',
      'mailto:a@b.c',
      'tel:+1',
    ]) {
      expect(safeUrl(url), url).toBe(url);
    }
    for (const url of [
      'javascript:alert(1)',
      'JaVaScRiPt:alert(1)',
      'java\tscript:alert(1)',
      ' javascript:x',
      'vbscript:x',
      'data:text/html,<b>',
      'file:///etc',
    ]) {
      expect(safeUrl(url), url).toBeNull();
    }
    expect(safeUrl('data:image/png;base64,AAAA', 'image')).toBe('data:image/png;base64,AAAA');
    expect(safeUrl('data:image/svg+xml;base64,AAAA', 'image')).toBeNull();
    expect(safeUrl('mailto:a@b.c', 'image')).toBeNull();
  });
});

describe('slugs', () => {
  it('keeps letters of any script and collapses the rest', () => {
    expect(slugify('Café & Crème')).toBe('café-crème');
    expect(slugify('  Hello, World!  ')).toBe('hello-world');
    expect(slugify('日本語 テキスト')).toBe('日本語-テキスト');
    expect(slugify('!!!')).toBe('');
  });

  it('hands out unique slugs with a prefix', () => {
    const slug = createSlugger('doc-');
    expect([slug('Usage'), slug('Usage'), slug('!!'), slug('Usage')]).toEqual([
      'doc-usage',
      'doc-usage-2',
      'doc-section',
      'doc-usage-3',
    ]);
  });
});

describe('frontmatter', () => {
  it('splits a leading block from the body', () => {
    expect(splitFrontmatter('---\ntitle: A\n---\n# Body')).toEqual({
      frontmatter: 'title: A',
      body: '# Body',
    });
    expect(splitFrontmatter('﻿---\r\na: 1\r\n---')).toEqual({ frontmatter: 'a: 1', body: '' });
    expect(splitFrontmatter('# No frontmatter')).toEqual({
      frontmatter: null,
      body: '# No frontmatter',
    });
  });

  it('parses the YAML subset', () => {
    expect(
      parseFrontmatter(
        [
          '# a comment',
          'title: "Getting \\"started\\""',
          "quote: 'It''s fine'",
          'count: 12',
          'ratio: -1.5e2',
          'draft: false',
          'published: true',
          'empty: ~',
          'plain: some words # trailing comment',
          'tags: [one, "two, three", 4]',
          'none: []',
          'authors:',
          '  - Ada',
          '  - 3',
          'meta:',
          '  kind: guide',
          '  order: 2',
          'blank:',
          '',
        ].join('\n')
      )
    ).toEqual({
      title: 'Getting "started"',
      quote: "It's fine",
      count: 12,
      ratio: -150,
      draft: false,
      published: true,
      empty: null,
      plain: 'some words',
      tags: ['one', 'two, three', 4],
      none: [],
      authors: ['Ada', 3],
      meta: { kind: 'guide', order: 2 },
      blank: null,
    });
  });

  it('refuses what it cannot read, naming the line', () => {
    expect(() => parseFrontmatter('title')).toThrow(
      new RangeError('Frontmatter line 1: expected "key: value"')
    );
    expect(() => parseFrontmatter('  orphan: 1')).toThrow(/line 1: indented, but under no key/);
    expect(() => parseFrontmatter('list:\n  - a\n  key: b')).toThrow(/line 3/);
    expect(() => parseFrontmatter('map:\n  key: b\n  - a')).toThrow(/line 3: list item in a map/);
    expect(() => parseFrontmatter('tags: [a, b')).toThrow(/unclosed list/);
    expect(() => parseFrontmatter("tags: ['a, b]")).toThrow(/unclosed quote/);
    expect(() => parseFrontmatter('block: |')).toThrow(/needs a full YAML parser/);
  });
});

describe('rendering', () => {
  it('renders GFM with linked, de-duplicated headings and a table of contents', () => {
    const result = renderMarkdownSync(
      '# Title\n\n## Usage\n\n### Details\n\n#### Deep\n\n## Usage\n\n| a | b |\n| - | - |\n| 1 | 2 |'
    );
    expect(result.title).toBe('Title');
    expect(result.toc.map((item) => item.id)).toEqual(['usage', 'details', 'usage-2']);
    expect(result.headings).toHaveLength(5);
    expect(result.html).toContain(
      '<h2 id="usage"><a class="ldt-heading-anchor" href="#usage">Usage</a></h2>'
    );
    expect(result.html).toContain('<table>');
    expect(result.highlighted).toBe(false);
    expect(render('## Plain', { headingLinks: false, idPrefix: 'x-' })).toBe(
      '<h2 id="x-plain">Plain</h2>\n'
    );
    expect(renderMarkdownSync('## A\n#### B', { tocDepth: [4, 4] }).toc).toEqual([
      { id: 'b', text: 'B', depth: 4 },
    ]);
  });

  it('takes its title from frontmatter first, and can leave the heading out', () => {
    const withFrontmatter = renderMarkdownSync('---\ntitle: From meta\n---\n# From heading');
    expect(withFrontmatter.title).toBe('From meta');
    expect(withFrontmatter.frontmatter).toEqual({ title: 'From meta' });
    const stripped = renderMarkdownSync('# Page\n\nBody\n\n# Second', { stripTitle: true });
    expect(stripped.html).not.toContain('>Page<');
    expect(stripped.html).toContain('>Second<');
    expect(stripped.title).toBe('Page');
    expect(renderMarkdownSync('No heading').title).toBeNull();
    const custom = renderMarkdownSync('---\nanything\n---\n', {
      parseFrontmatter: (text) => ({ raw: text }),
    });
    expect(custom.frontmatter).toEqual({ raw: 'anything' });
  });

  it('renders admonitions and GitHub alerts as notes in the alert tones', () => {
    const html = render(
      ':::caution Mind the **step**\nBody\n:::\n\n> [!NOTE]\n> Read *this*.\n\n:::tip\nShort\n:::'
    );
    expect(html).toContain(
      '<div class="ldt-alert ldt-alert--error ldt-admonition" data-kind="caution" role="note"><p class="ldt-alert__title">Mind the <strong>step</strong></p>'
    );
    expect(html).toContain('data-kind="note"');
    expect(html).toContain('<p class="ldt-alert__title">Note</p>');
    expect(html).toContain('<p>Read <em>this</em>.</p>');
    expect(html).toContain('ldt-alert--success');
    expect(render(':::tip\nShort\n:::', { admonitionLabels: { tip: 'Hint' } })).toContain(
      '>Hint</p>'
    );
    expect(render(':::unknown\nx\n:::')).not.toContain('ldt-admonition');
  });

  it('numbers footnotes by first use and links both ways', () => {
    const html = render(
      'B[^b] then A[^a] and B[^b] again, and [^missing].\n\n[^a]: First *def*.\n[^b]: Second\n  continued.',
      {
        idPrefix: 'p-',
      }
    );
    expect(html).toContain(
      '<a id="p-fnref-b" href="#p-fn-b" aria-describedby="p-footnotes-label">1</a>'
    );
    expect(html).toContain(
      '<a id="p-fnref-a" href="#p-fn-a" aria-describedby="p-footnotes-label">2</a>'
    );
    expect(html).toContain('[^missing]');
    expect(html).toContain(
      '<li id="p-fn-b">Second continued. <a class="ldt-footnote-back" href="#p-fnref-b" aria-label="Back to reference 1">↩</a></li>'
    );
    expect(html).toContain('<li id="p-fn-a">First <em>def</em>.');
    expect(html.indexOf('p-fn-b"')).toBeLessThan(html.indexOf('p-fn-a"'));
    expect(render('No notes.')).not.toContain('ldt-footnotes');
  });

  it('renders definition lists, leaving look-alikes alone', () => {
    expect(render('Term *one*\n: First\n: Second **bold**')).toBe(
      '<dl><dt>Term <em>one</em></dt><dd>First</dd><dd>Second <strong>bold</strong></dd></dl>\n'
    );
    // A numbered line is a list, even with a definition line after it.
    expect(render('1. Item\n: definition')).toMatch(/^<ol>/);
    expect(render('Plain paragraph\nwith two lines')).not.toContain('<dl>');
  });

  it('names task checkboxes', () => {
    expect(render('- [x] Done\n- [ ] Open')).toContain(
      '<input type="checkbox" disabled checked aria-label="Done">'
    );
    expect(render('- [ ] Open', { taskLabels: { done: 'Fait', open: 'À faire' } })).toContain(
      'aria-label="À faire"'
    );
  });

  it('frames code with a filename, a label and a copy button', () => {
    const html = render(
      '```ts title="app.ts"\nconst a = 1 < 2;\n```\n\n```sh:run.sh\nls\n```\n\n```\nplain\n```',
      {
        copyLabel: 'Copy code',
      }
    );
    expect(html).toContain(
      '<figure class="ldt-code" data-lang="ts"><figcaption class="ldt-code__header"><span class="ldt-code__filename">app.ts</span><button type="button" class="ldt-code__copy" data-ldt-copy>Copy code</button></figcaption><pre class="ldt-code__pre" tabindex="0" aria-label="app.ts"><code class="language-ts">const a = 1 &lt; 2;</code></pre></figure>'
    );
    expect(html).toContain('<span class="ldt-code__filename">run.sh</span>');
    expect(html).toContain('aria-label="Code"><code>plain</code>');
    expect(render('```js\nx\n```')).toContain('aria-label="js code"');
  });

  it('keeps Mermaid source, escaped, for the component to draw', () => {
    expect(render('```mermaid\ngraph TD; A-->B\n```')).toBe(
      '<pre class="ldt-mermaid" data-ldt-mermaid>graph TD; A--&gt;B</pre>\n'
    );
  });

  it('runs a sanitizer last', () => {
    expect(render('Hello', { sanitize: (html: string) => html.toUpperCase() })).toBe(
      '<P>HELLO</P>\n'
    );
  });
});

describe('untrusted markdown', () => {
  const attacks = [
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<a href="javascript:alert(1)">x</a>',
    '[click](javascript:alert(1))',
    '[click](JAVASCRIPT:alert(1) "t")',
    '![x](javascript:alert(1))',
    '![x" onerror="alert(1)](/ok.png)',
    '[x](/ok "a\\" onmouseover=\\"alert(1)")',
    '<iframe src="https://evil.test"></iframe>',
    ':::note <img src=x onerror=alert(1)>\nbody\n:::',
    'Term <b onclick=alert(1)>\n: def',
    '[^<img src=x onerror=alert(1)>]\n\n[^<img src=x onerror=alert(1)>]: note',
    '```mermaid\n</pre><script>alert(1)</script>\n```',
    '```ts title="<script>alert(1)</script>"\nx\n```',
    '# <img src=x onerror=alert(1)>',
  ];

  it.each(attacks)('renders %s inert', (attack) => {
    // Parsed as a browser would, so escaped text inside an attribute is not mistaken for markup.
    const doc = new DOMParser().parseFromString(render(attack), 'text/html');
    expect(doc.querySelector('script, iframe, object, embed')).toBeNull();
    for (const element of doc.body.querySelectorAll('*')) {
      for (const { name, value } of element.attributes) {
        expect(name.startsWith('on'), `${element.tagName} ${name}`).toBe(false);
        if (name === 'href' || name === 'src')
          expect(value.toLowerCase()).not.toContain('javascript:');
      }
    }
  });

  it('passes raw HTML only when allowed', () => {
    expect(render('<b>bold</b>', { allowHtml: true })).toContain('<b>bold</b>');
    expect(render('<b>bold</b>')).toContain('&lt;b&gt;bold&lt;/b&gt;');
  });

  it('marks refused links and keeps their text', () => {
    expect(render('[text](javascript:x)')).toBe(
      '<p><span class="ldt-unsafe-link">text</span></p>\n'
    );
    expect(render('![alt text](vbscript:x)')).toBe('<p>alt text</p>\n');
    expect(render('[ext](https://x.test "Title")')).toBe(
      '<p><a href="https://x.test" title="Title" rel="noopener">ext</a></p>\n'
    );
    expect(render('![a](/i.png "T")')).toBe(
      '<p><img src="/i.png" alt="a" title="T" loading="lazy"></p>\n'
    );
  });
});

describe('highlighting', () => {
  it('highlights with a function of your own, and falls back per block when it fails', async () => {
    const highlight = vi.fn(async (code: string, lang: string) => {
      if (lang === 'bad') throw new Error('nope');
      return lang === 'plain' ? null : `<span class="hl">${code}</span>`;
    });
    const result = await renderMarkdown('```js\nx\n```\n\n```bad\ny\n```\n\n```plain\nz\n```', {
      highlight,
    });
    expect(result.html).toContain('<code class="language-js"><span class="hl">x</span></code>');
    expect(result.html).toContain('<code class="language-bad">y</code>');
    expect(result.highlighted).toBe(true);
  });

  it('leaves code plain when highlighting is off or unavailable', async () => {
    expect((await renderMarkdown('```js\nx\n```', { highlight: false })).highlighted).toBe(false);
    expect((await renderMarkdown('```js\nx\n```')).highlighted).toBe(false);
  });

  it('highlights with real Shiki, on the css-variables theme', async () => {
    setHighlighterLoader(() => import('shiki'));
    const result = await renderMarkdown(
      '```ts\nconst answer: number = 42;\n```\n\n```nosuchlang\nx\n```\n\n```text\nplain\n```'
    );
    expect(result.highlighted).toBe(true);
    expect(result.html).toContain('var(--ldt-syntax-token-keyword)');
    expect(result.html).toContain('<code class="language-nosuchlang">x</code>');
    expect(result.html).toContain('<code class="language-text">plain</code>');
  }, 20_000);

  it('loads Shiki from a default export or a global, and nothing from anything else', async () => {
    const shiki = await import('shiki');
    setHighlighterLoader(() => ({ default: shiki }));
    expect(await loadHighlighter()).toBeTypeOf('function');
    setHighlighterLoader(null);
    (globalThis as { shiki?: unknown }).shiki = { nothing: true };
    expect(await loadHighlighter()).toBeNull();
    delete (globalThis as { shiki?: unknown }).shiki;
    setHighlighterLoader(() => {
      throw new Error('missing');
    });
    expect(await loadHighlighter()).toBeNull();
  });

  it('skips languages Shiki cannot load', async () => {
    const highlight = createShikiHighlight({
      createCssVariablesTheme: () => ({}),
      createHighlighter: async () => ({
        codeToHtml: () => '<pre><code>never</code></pre>',
        loadLanguage: async () => {
          throw new Error('bad grammar');
        },
        getLoadedLanguages: () => [],
      }),
    });
    expect(await highlight('x', 'weird')).toBeNull();
    expect(await highlight('x', '')).toBeNull();
  });
});

describe('mermaid', () => {
  const api = {
    initialize: vi.fn(),
    render: vi.fn(async (id: string) => ({ svg: `<svg id="${id}"></svg>` })),
  };

  it('loads from a loader, a default export or a global', async () => {
    setMermaidLoader(() => api);
    expect(await loadMermaid()).toBe(api);
    setMermaidLoader(() => ({ default: api }));
    expect(await loadMermaid()).toBe(api);
    setMermaidLoader(null);
    expect(await loadMermaid()).toBeNull();
    (globalThis as { mermaid?: unknown }).mermaid = api;
    setMermaidLoader(null);
    expect(await loadMermaid()).toBe(api);
    delete (globalThis as { mermaid?: unknown }).mermaid;
  });

  it('renders strictly, one diagram at a time', async () => {
    const order: string[] = [];
    const slow = {
      initialize: vi.fn((config: Record<string, unknown>) =>
        order.push(`init:${(config.themeVariables as { lineColor: string }).lineColor}`)
      ),
      render: vi.fn(async (id: string) => {
        await new Promise((resolve) => setTimeout(resolve, 5));
        order.push(`render:${id}`);
        return { svg: id };
      }),
    };
    const [a, b] = await Promise.all([
      renderMermaid(slow, 'a', 'graph TD; A', { lineColor: 'red' }),
      renderMermaid(slow, 'b', 'graph TD; B', { lineColor: 'blue' }),
    ]);
    expect([a, b]).toEqual(['a', 'b']);
    expect(order).toEqual(['init:red', 'render:a', 'init:blue', 'render:b']);
    expect(slow.initialize).toHaveBeenCalledWith(
      expect.objectContaining({
        securityLevel: 'strict',
        theme: 'base',
        themeCSS: expect.stringContaining('rx: 0'),
      })
    );
    const failing = {
      initialize: vi.fn(),
      render: vi.fn(async () => Promise.reject(new Error('parse error'))),
    };
    await expect(renderMermaid(failing, 'c', 'bad', {})).rejects.toThrow('parse error');
    await expect(renderMermaid(slow, 'd', 'ok', { lineColor: 'x' })).resolves.toBe('d');
  });
});
