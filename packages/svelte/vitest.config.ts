import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // `svelteTesting()` applies the browser resolve conditions properly (extending Vite's
  // defaults instead of replacing them). Auto-cleanup stays off: tests/setup.ts registers
  // cleanup explicitly, together with jsdom teardown it needs to sequence around.
  plugins: [svelte({ compilerOptions: { runes: true } }), svelteTesting({ autoCleanup: false })],
  test: {
    environment: 'jsdom',
    // Node's experimental Web Storage global shadows jsdom's implementation but is undefined
    // without `--localstorage-file`. Browser tests need jsdom's isolated, in-memory storage.
    execArgv: ['--no-experimental-webstorage'],
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/ssr/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/lib/**/*.{ts,svelte}'],
      exclude: ['src/lib/index.ts', 'src/lib/types.ts'],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
