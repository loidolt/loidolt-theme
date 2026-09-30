import { loadMermaid, renderMermaid } from '../core/mermaid.js';
import { escapeHtml } from '../core/escape.js';

/** Theme colours a diagram is drawn with, as Mermaid's `themeVariables`. */
export interface DiagramColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
}

export const diagramRoles = {
  background: 'background',
  surface: 'surface',
  surfaceAlt: 'surfaceAlt',
  text: 'text',
  muted: 'textMuted',
  border: 'borderStrong',
  accent: 'accent',
} as const;

export const themeVariables = (colors: DiagramColors): Record<string, string> => ({
  background: colors.background,
  primaryColor: colors.surfaceAlt,
  primaryTextColor: colors.text,
  primaryBorderColor: colors.border,
  secondaryColor: colors.surface,
  tertiaryColor: colors.background,
  lineColor: colors.muted,
  textColor: colors.text,
  mainBkg: colors.surfaceAlt,
  nodeBorder: colors.border,
  clusterBkg: colors.surface,
  noteBkgColor: colors.surface,
  noteTextColor: colors.text,
  edgeLabelBackground: colors.background,
  fontSize: '14px',
});

let counter = 0;

/**
 * Draws a diagram into `target` from `source`. Leaves `target` alone — still showing the source —
 * when Mermaid is not available or the source does not parse.
 */
export async function drawDiagram(
  target: HTMLElement,
  source: string,
  colors: DiagramColors
): Promise<boolean> {
  const api = await loadMermaid();
  if (!api) return false;
  try {
    counter += 1;
    const svg = await renderMermaid(api, `ldt-mermaid-${counter}`, source, themeVariables(colors));
    target.innerHTML = svg;
    return true;
  } catch {
    return false;
  }
}

/**
 * Turns every `<pre data-ldt-mermaid>` in `root` into a figure: the drawn diagram, named for
 * assistive tech, with its source kept in a disclosure beneath. Redraws figures it already made
 * (for a theme change).
 */
export async function enhanceDiagrams(
  root: HTMLElement,
  colors: DiagramColors,
  { label, sourceLabel }: { label: string; sourceLabel: string }
): Promise<void> {
  for (const pre of root.querySelectorAll<HTMLElement>('pre[data-ldt-mermaid]')) {
    const source = pre.textContent ?? '';
    const figure = document.createElement('figure');
    figure.className = 'ldt-mermaid';
    figure.dataset.ldtMermaidSource = source;
    figure.innerHTML = `<div class="ldt-mermaid__diagram" role="img" aria-label="${escapeHtml(label)}"></div><details class="ldt-mermaid__source"><summary>${escapeHtml(sourceLabel)}</summary><pre>${escapeHtml(source)}</pre></details>`;
    const diagram = figure.firstElementChild as HTMLElement;
    if (await drawDiagram(diagram, source, colors)) pre.replaceWith(figure);
  }
  for (const figure of root.querySelectorAll<HTMLElement>('figure[data-ldt-mermaid-source]')) {
    const diagram = figure.querySelector<HTMLElement>('.ldt-mermaid__diagram');
    if (diagram) await drawDiagram(diagram, figure.dataset.ldtMermaidSource ?? '', colors);
  }
}

/**
 * Copies a code block's text when its copy button is pressed, and says so on the button for a
 * moment. One listener serves every block in `root`.
 */
export function handleCopy(
  root: HTMLElement,
  { copiedLabel, onCopied }: { copiedLabel: string; onCopied?: (text: string) => void }
): () => void {
  const listener = async (event: Event) => {
    const button = (event.target as Element | null)?.closest<HTMLButtonElement>('[data-ldt-copy]');
    if (!button || !root.contains(button)) return;
    const code = button.closest('.ldt-code')?.querySelector('code')?.textContent ?? '';
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      return;
    }
    const original = button.dataset.label ?? button.textContent ?? '';
    button.dataset.label = original;
    button.textContent = copiedLabel;
    onCopied?.(code);
    setTimeout(() => {
      button.textContent = original;
    }, 2000);
  };
  root.addEventListener('click', listener);
  return () => root.removeEventListener('click', listener);
}
