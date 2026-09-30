// The jsdom environment itself comes from ../svelte/tests/setup.ts (see vitest.config.ts); this
// import brings its matcher types into this package's type-check too.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { setHighlighterLoader } from '../src/lib/core/highlight.js';
import { setMermaidLoader } from '../src/lib/core/mermaid.js';

afterEach(() => {
  setHighlighterLoader(null);
  setMermaidLoader(null);
  document.documentElement.removeAttribute('data-theme');
});
