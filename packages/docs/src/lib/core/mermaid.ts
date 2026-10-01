/*
 * Mermaid diagrams — an optional peer this package never imports itself. Register it once:
 *
 *   import { setMermaidLoader } from '@loidolt/theme-docs';
 *   setMermaidLoader(() => import('mermaid').then((module) => module.default));
 */

/** The slice of the Mermaid API used here. */
export interface MermaidApi {
  initialize(config: Record<string, unknown>): void;
  render(id: string, source: string): Promise<{ svg: string }>;
}

export type MermaidLoader = () => Promise<unknown> | unknown;

let registered: MermaidLoader | null = null;
let cached: Promise<MermaidApi | null> | null = null;
let queue: Promise<unknown> = Promise.resolve();

/** Registers how to load Mermaid. `null` unregisters. */
export function setMermaidLoader(loader: MermaidLoader | null): void {
  registered = loader;
  cached = null;
}

/** Mermaid, from the registered loader or a global `mermaid`, or `null` when neither is there. */
export function loadMermaid(): Promise<MermaidApi | null> {
  cached ??= Promise.resolve()
    .then(registered ?? (() => (globalThis as { mermaid?: unknown }).mermaid))
    .then((module) => {
      const api = (module as { default?: MermaidApi })?.default?.render
        ? (module as { default: MermaidApi }).default
        : (module as MermaidApi | undefined);
      return typeof api?.render === 'function' ? api : null;
    })
    .catch(() => null);
  return cached;
}

/**
 * Renders one diagram. Mermaid's configuration is global, so renders are queued: two diagrams
 * in different themes must not configure each other.
 */
export function renderMermaid(
  api: MermaidApi,
  id: string,
  source: string,
  themeVariables: Record<string, string>
): Promise<string> {
  const run = queue.then(async () => {
    api.initialize({
      startOnLoad: false,
      securityLevel: 'strict',
      theme: 'base',
      themeVariables,
      // Square state boxes, like everything else here. Mermaid's own styles round them, and they
      // sit in the diagram's unlayered `<style>`, out of reach of the stylesheet. Flowchart
      // shapes keep their corners, which carry meaning.
      themeCSS: '.statediagram-state rect.basic { rx: 0; ry: 0; }',
      fontFamily: 'inherit',
    });
    return (await api.render(id, source)).svg;
  });
  queue = run.catch(() => undefined);
  return run;
}
