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
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/ssr/**'],
  },
});
