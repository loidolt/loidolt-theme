import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vitest/config';

// Separate project: in a node environment Vitest runs modules through Vite's SSR pipeline, which
// is where an app's server bundle imports this package. Nothing may touch the DOM at import.
export default defineConfig({
  plugins: [svelte({ compilerOptions: { runes: true } })],
  test: {
    environment: 'node',
    include: ['tests/ssr/**/*.test.ts'],
  },
});
