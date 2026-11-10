// The jsdom environment itself comes from ../svelte/tests/setup.ts (see vitest.config.ts); this
// import brings its matcher types into this package's type-check too.
import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { platform, systemBars } from './fakes.js';

vi.mock('@capacitor/core', async () => (await import('./fakes.js')).core);

afterEach(() => {
  platform.current = 'web';
  systemBars.setStyle.mockClear();
  const root = document.documentElement;
  for (const attribute of ['data-theme', 'data-preset', 'data-keyboard', 'data-native-platform']) {
    root.removeAttribute(attribute);
  }
  root.removeAttribute('style');
  document.body.replaceChildren();
});
