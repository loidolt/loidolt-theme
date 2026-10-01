// The jsdom environment itself comes from ../svelte/tests/setup.ts (see vitest.config.ts); these
// import brings its matcher types into this package's type-check too.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { setMapLibreLoader } from '../src/lib/maplibre.js';

afterEach(() => {
  setMapLibreLoader(null);
  document.documentElement.removeAttribute('data-theme');
});
