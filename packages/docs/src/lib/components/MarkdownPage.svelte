<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { PageHeader, cx } from '@loidolt/theme-svelte';
  import { renderMarkdownSync } from '../core/render.js';
  import type { DocsLink, MarkdownOptions, RenderedMarkdown } from '../core/types.js';
  import Markdown from './Markdown.svelte';
  import TocPanel from './TocPanel.svelte';

  interface Props extends HTMLAttributes<HTMLDivElement> {
    source?: string;
    /** A result rendered ahead of time — pass `stripTitle: true` when rendering it. */
    result?: RenderedMarkdown;
    options?: MarkdownOptions;
    /**
     * The page title. Defaults to the frontmatter `title`, then the document's first `#`
     * heading, which is left out of the body so the page has one level-1 heading.
     */
    title?: string;
    /** Defaults to the frontmatter `description`. */
    description?: string;
    /** Defaults to the frontmatter `eyebrow` or `section`. */
    eyebrow?: string;
    /** Show the table of contents beside the page (behind a button on narrow screens). */
    toc?: boolean;
    tocTitle?: string;
    previous?: DocsLink;
    next?: DocsLink;
    previousLabel?: string;
    nextLabel?: string;
    /** Names the previous/next navigation. */
    pagerLabel?: string;
    /** Content after the document, before the previous/next links. */
    footer?: Snippet;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    source = '',
    result,
    options = {},
    title,
    description,
    eyebrow,
    toc = true,
    tocTitle = 'On this page',
    previous,
    next,
    previousLabel = 'Previous',
    nextLabel = 'Next',
    pagerLabel = 'More pages',
    footer,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let article = $state<HTMLElement | null>(null);
  const pageOptions = $derived({ ...options, stripTitle: true });
  // The synchronous render gives the server its title and contents; `Markdown` reports any
  // later (highlighted) render, which has the same headings.
  let reported = $state.raw<RenderedMarkdown | null>(null);
  const current = $derived(reported ?? result ?? renderMarkdownSync(source, pageOptions));

  const text = (value: unknown) => (typeof value === 'string' ? value : undefined);
  const meta = $derived(current.frontmatter ?? {});
  const heading = $derived(title ?? current.title ?? '');
  const hasToc = $derived(toc && current.toc.length > 0);
</script>

<div
  bind:this={ref}
  class={cx('ldt-markdown-page', hasToc && 'ldt-markdown-page--toc', className)}
  {...rest}
>
  <!-- First in reading order: the "On this page" button leads on narrow screens, and the
       contents sit beside the page on wide ones. -->
  {#if hasToc}
    <TocPanel
      class="ldt-markdown-page__toc"
      items={current.toc}
      title={tocTitle}
      container={article}
    />
  {/if}
  <div class="ldt-markdown-page__main">
    {#if heading}
      <PageHeader
        title={heading}
        description={description ?? text(meta.description)}
        eyebrow={eyebrow ?? text(meta.eyebrow) ?? text(meta.section)}
        headingLevel={1}
      />
    {/if}
    <Markdown
      bind:ref={article}
      {source}
      {result}
      options={pageOptions}
      onRender={(rendered) => (reported = rendered)}
    />
    {@render footer?.()}
    {#if previous || next}
      <nav class="ldt-markdown-page__pager" aria-label={pagerLabel}>
        {#if previous}
          <a class="ldt-markdown-page__previous" href={previous.href} rel="prev">
            <span class="ldt-markdown-page__direction">{previousLabel}</span>
            <span>{previous.title}</span>
          </a>
        {/if}
        {#if next}
          <a class="ldt-markdown-page__next" href={next.href} rel="next">
            <span class="ldt-markdown-page__direction">{nextLabel}</span>
            <span>{next.title}</span>
          </a>
        {/if}
      </nav>
    {/if}
  </div>
</div>
