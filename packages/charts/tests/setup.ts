// The jsdom environment itself comes from ../svelte/tests/setup.ts (see vitest.config.ts); these
// import brings its matcher types into this package's type-check too.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { setEChartsLoader } from '../src/lib/echarts.js';

afterEach(() => {
  setEChartsLoader(null);
  document.documentElement.removeAttribute('data-theme');
});
