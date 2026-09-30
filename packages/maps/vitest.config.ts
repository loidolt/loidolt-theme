import { svelte } from '@sveltejs/vite-plugin-svelte';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vitest/config';

// Mirrors packages/svelte: the same jsdom setup (reused, not copied) plus this package's own.
export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } }), svelteTesting({ autoCleanup: false })],
  test: {
    environment: 'jsdom',
    execArgv: ['--no-experimental-webstorage'],
    setupFiles: ['../svelte/tests/setup.ts', './tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/ssr/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      include: ['src/lib/**/*.{ts,svelte}'],
      // The worker entry is a two-line relay to `handler.ts`, which is tested directly.
      exclude: [
        'src/lib/index.ts',
        'src/lib/core/index.ts',
        'src/lib/core/types.ts',
        'src/lib/core/workers/spatial.worker.ts',
      ],
      thresholds: {
        statements: 90,
        branches: 80,
        functions: 90,
        lines: 90,
      },
    },
  },
});
