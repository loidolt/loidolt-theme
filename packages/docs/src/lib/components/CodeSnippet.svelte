<script lang="ts">
  import type { Attachment } from 'svelte/attachments';
  import type { HTMLAttributes } from 'svelte/elements';
  import { LiveRegion, createAnnouncer, cx } from '@loidolt/theme-svelte';
  import { loadHighlighter } from '../core/highlight.js';
  import { handleCopy } from '../internal/enhance.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    code: string;
    /** Language for highlighting, e.g. `ts`, `svelte`, `css`. */
    lang?: string;
    /** Shown above the code, and names it. */
    filename?: string;
    /** Names the code for assistive tech when there is no filename. Defaults to "‹lang› code". */
    label?: string;
    /** Offer a copy button. */
    copyable?: boolean;
    copyLabel?: string;
    copiedLabel?: string;
    /** Highlight with the registered Shiki loader, when there is one. */
    highlight?: boolean;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    code,
    lang = '',
    filename,
    label,
    copyable = true,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    highlight = true,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const announcer = createAnnouncer();
  let highlighted = $state<string | null>(null);

  $effect(() => {
    const [text, language, wanted] = [code, lang, highlight];
    highlighted = null;
    if (!wanted) return;
    let cancelled = false;
    void loadHighlighter()
      .then((run) => run?.(text, language))
      .then((html) => {
        if (!cancelled && html) highlighted = html;
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  });

  const name = $derived(filename ?? label ?? (lang ? `${lang} code` : 'Code'));
  const copy: Attachment<HTMLElement> = (node) =>
    handleCopy(node, { copiedLabel, onCopied: () => announcer.announce(copiedLabel) });
</script>

<!-- eslint-disable svelte/no-at-html-tags -- Shiki's spans, built from escaped source -->
<figure
  bind:this={ref}
  class={cx('ldt-code ldt-code-snippet', className)}
  data-lang={lang || undefined}
  {@attach copy}
  {...rest}
>
  {#if filename || copyable}
    <figcaption class="ldt-code__header">
      {#if filename}<span class="ldt-code__filename">{filename}</span>{/if}
      {#if copyable}<button type="button" class="ldt-code__copy" data-ldt-copy>{copyLabel}</button
        >{/if}
    </figcaption>
  {/if}
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <pre class="ldt-code__pre" tabindex="0" aria-label={name}><code
      class={lang ? `language-${lang}` : undefined}
      >{#if highlighted}{@html highlighted}{:else}{code}{/if}</code
    ></pre>
  <LiveRegion message={announcer.message} politeness={announcer.politeness} />
</figure>
<!-- eslint-enable svelte/no-at-html-tags -->
