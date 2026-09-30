<script lang="ts">
  import { untrack } from 'svelte';
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { LiveRegion, createAnnouncer, createTokenColors, cx } from '@loidolt/theme-svelte';
  import { renderMarkdown, renderMarkdownSync } from '../core/render.js';
  import type { MarkdownOptions, RenderedMarkdown } from '../core/types.js';
  import { diagramRoles, enhanceDiagrams, handleCopy } from '../internal/enhance.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Markdown to render. The first render is synchronous, so it is in the server's HTML. */
    source?: string;
    /** Or a result from `renderMarkdown` — e.g. rendered and highlighted in a server `load`. */
    result?: RenderedMarkdown;
    /** Rendering options: HTML policy, heading links, labels… See `MarkdownOptions`. */
    options?: MarkdownOptions;
    /** What a copy button says, and what is announced, once its code is copied. */
    copiedLabel?: string;
    /** Names a drawn Mermaid diagram. */
    diagramLabel?: string;
    /** Labels the disclosure holding a diagram's source. */
    diagramSourceLabel?: string;
    /** Called with each render — the synchronous one, then the highlighted one if it differs. */
    onRender?: (result: RenderedMarkdown) => void;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    source = '',
    result,
    options = {},
    copiedLabel = 'Copied',
    diagramLabel = 'Diagram',
    diagramSourceLabel = 'Diagram source',
    onRender,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const announcer = createAnnouncer();
  const palette = createTokenColors(diagramRoles, { element: () => ref });

  const initial = $derived(result ?? renderMarkdownSync(source, options));
  let highlighted = $state.raw<RenderedMarkdown | null>(null);
  const shown = $derived(highlighted ?? initial);

  // In the browser, render again with highlighting when a highlighter is registered.
  $effect(() => {
    const [text, settings, given] = [source, options, result];
    highlighted = null;
    if (given || !text) return;
    let cancelled = false;
    void renderMarkdown(text, settings).then((next) => {
      if (!cancelled && next.highlighted) highlighted = next;
    });
    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    const current = shown;
    untrack(() => onRender?.(current));
  });

  // Diagrams: drawn once the HTML is in place, and redrawn when the theme changes.
  $effect(() => {
    void shown.html;
    const colors = palette.colors;
    const root = ref;
    if (root)
      void enhanceDiagrams(root, colors, { label: diagramLabel, sourceLabel: diagramSourceLabel });
  });

  $effect(() => {
    if (ref) untrack(() => palette.refresh());
  });

  const copy: Attachment<HTMLElement> = (node) =>
    handleCopy(node, { copiedLabel, onCopied: () => announcer.announce(copiedLabel) });
</script>

<article bind:this={ref} class={cx('ldt-prose ldt-markdown', className)} {@attach copy} {...rest}>
  <!-- Rendered by `renderMarkdown`: raw HTML escaped unless `allowHtml`, URLs allow-listed. -->
  <!-- eslint-disable-next-line svelte/no-at-html-tags -->
  {@html shown.html}
</article>
<LiveRegion message={announcer.message} politeness={announcer.politeness} />
