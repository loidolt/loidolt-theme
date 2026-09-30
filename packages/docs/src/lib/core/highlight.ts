import type { HighlightFunction } from './types.js';

/*
 * Syntax highlighting with Shiki — an optional peer this package never imports itself. Register
 * it once where you render markdown:
 *
 *   import { setHighlighterLoader } from '@loidolt/theme-docs';
 *   setHighlighterLoader(() => import('shiki'));
 *
 * Highlighting uses Shiki's CSS-variables theme, and the docs stylesheet maps those variables to
 * the `--loidolt-syntax-*` tokens: code follows the light and dark themes with no second pass.
 */

/** The slice of the `shiki` module used here. */
export interface ShikiModule {
  createHighlighter(options: { themes: unknown[]; langs: string[] }): Promise<ShikiHighlighter>;
  createCssVariablesTheme(options: {
    name: string;
    variablePrefix: string;
    fontStyle?: boolean;
  }): unknown;
  bundledLanguages?: Record<string, unknown>;
}

export interface ShikiHighlighter {
  codeToHtml(code: string, options: { lang: string; theme: string }): string;
  loadLanguage(...langs: string[]): Promise<void>;
  getLoadedLanguages(): string[];
}

export type ShikiLoader = () => Promise<unknown> | unknown;

let registered: ShikiLoader | null = null;
let cached: Promise<HighlightFunction | null> | null = null;

/** Registers how to load Shiki. `null` unregisters. */
export function setHighlighterLoader(loader: ShikiLoader | null): void {
  registered = loader;
  cached = null;
}

const THEME = 'loidolt';

/** A highlighter over Shiki: loads each language the first time it is seen. */
export function createShikiHighlight(shiki: ShikiModule): HighlightFunction {
  const theme = shiki.createCssVariablesTheme({
    name: THEME,
    variablePrefix: '--ldt-syntax-',
    fontStyle: true,
  });
  const ready = shiki.createHighlighter({ themes: [theme], langs: [] });
  return async (code, lang) => {
    const highlighter = await ready;
    const language = lang.toLowerCase();
    if (!language || language === 'text' || language === 'plaintext') return null;
    if (!highlighter.getLoadedLanguages().includes(language)) {
      if (shiki.bundledLanguages && !(language in shiki.bundledLanguages)) return null;
      try {
        await highlighter.loadLanguage(language);
      } catch {
        return null;
      }
    }
    const html = highlighter.codeToHtml(code, { lang: language, theme: THEME });
    // Keep the highlighted spans only; the frame around them is ours.
    return /<code[^>]*>([\s\S]*)<\/code>/.exec(html)?.[1] ?? null;
  };
}

/**
 * The highlighter, from the registered loader or a global `shiki`. Resolves `null` when there
 * is neither — code then stays plain, never broken.
 */
export function loadHighlighter(): Promise<HighlightFunction | null> {
  cached ??= Promise.resolve()
    .then(registered ?? (() => (globalThis as { shiki?: unknown }).shiki))
    .then((module) => {
      const shiki = (module as { default?: ShikiModule })?.default?.createHighlighter
        ? (module as { default: ShikiModule }).default
        : (module as ShikiModule | undefined);
      return typeof shiki?.createHighlighter === 'function' ? createShikiHighlight(shiki) : null;
    })
    .catch(() => null);
  return cached;
}
