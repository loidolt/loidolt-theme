// The jsdom environment itself comes from ../svelte/tests/setup.ts (see vitest.config.ts); this
// import brings its matcher types into this package's type-check too.
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { leaveTauri } from './fakes.js';

afterEach(() => {
  leaveTauri();
  document.documentElement.removeAttribute('data-tauri-platform');
  document.body.replaceChildren();
});
