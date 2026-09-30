import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/svelte';
import { afterEach, expect, vi } from 'vitest';
import * as matchers from 'vitest-axe/matchers';

expect.extend(matchers);

// Auto-cleanup only registers itself when Vitest globals are on; this suite does not use them,
// so without it every render would leak into the next test's queries.
afterEach(() => {
  cleanup();
  // Modal overlays park `pointer-events: none` on <body>. jsdom keeps no teardown hook for it,
  // so without this the next test's clicks are silently swallowed.
  document.body.removeAttribute('style');
});
Element.prototype.scrollIntoView = vi.fn();
Element.prototype.scrollTo = vi.fn();
HTMLCanvasElement.prototype.getContext = vi.fn(
  () => null
) as unknown as HTMLCanvasElement['getContext'];

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!('ResizeObserver' in globalThis)) {
  globalThis.ResizeObserver = class {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  } as unknown as typeof ResizeObserver;
}

// jsdom ships `CSS.escape` but not `CSS.supports`, which Bits' PinInput probes on creation.
if (typeof window.CSS?.supports !== 'function') {
  Object.assign(window.CSS ?? (window.CSS = {} as typeof CSS), { supports: () => false });
}
// …nor `elementFromPoint`, which its password-manager badge detection calls on a timer.
if (typeof document.elementFromPoint !== 'function') {
  document.elementFromPoint = () => null;
}
