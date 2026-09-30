<script lang="ts">
  import { untrack } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { createTokenColors, cx } from '@loidolt/theme-svelte';
  import { diagramRoles, drawDiagram } from '../internal/enhance.js';

  interface Props extends HTMLAttributes<HTMLElement> {
    /** Mermaid source. */
    code: string;
    /** Names the diagram — say what it shows, e.g. "Order lifecycle". */
    label: string;
    /** What it shows, in words, for readers who cannot see it. Shown under the diagram. */
    description?: string;
    /** Labels the disclosure holding the source. */
    sourceLabel?: string;
    class?: string;
    ref?: HTMLElement | null;
  }

  let {
    code,
    label,
    description,
    sourceLabel = 'Diagram source',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const id = $props.id();
  const palette = createTokenColors(diagramRoles, { element: () => ref });
  let diagram = $state<HTMLDivElement | null>(null);
  let drawn = $state(false);

  $effect(() => {
    if (ref) untrack(() => palette.refresh());
  });

  // Drawn in the browser, and again whenever the source or the theme changes.
  $effect(() => {
    const [target, source, colors] = [diagram, code, palette.colors];
    if (!target) return;
    let cancelled = false;
    void drawDiagram(target, source, colors).then((ok) => {
      if (!cancelled) drawn = ok;
    });
    return () => {
      cancelled = true;
    };
  });
</script>

<figure bind:this={ref} class={cx('ldt-mermaid', className)} {...rest}>
  <div
    bind:this={diagram}
    class="ldt-mermaid__diagram"
    role="img"
    aria-label={label}
    aria-describedby={description ? `${id}-description` : undefined}
    hidden={!drawn}
  ></div>
  {#if !drawn}
    <!-- Until the diagram is drawn — or if Mermaid is unavailable — the source stands in. -->
    <pre class="ldt-mermaid__fallback">{code}</pre>
  {/if}
  {#if description}<figcaption id={`${id}-description`} class="ldt-mermaid__caption">
      {description}
    </figcaption>{/if}
  {#if drawn}
    <details class="ldt-mermaid__source">
      <summary>{sourceLabel}</summary>
      <pre>{code}</pre>
    </details>
  {/if}
</figure>
