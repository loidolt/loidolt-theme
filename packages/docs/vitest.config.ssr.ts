import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Separate project: in a node environment Vitest runs modules through Vite's SSR pipeline,
// so vite-plugin-svelte emits server-compiled components — which cannot coexist with the
// client compile the jsdom suite uses.
export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    environment: 'node',
    include: ['tests/ssr/**/*.test.ts'],
  },
});
