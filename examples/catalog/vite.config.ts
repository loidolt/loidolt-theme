import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The workspace root, two levels up from examples/catalog.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // The font files live in packages/styles, outside this app's root; without this the dev
    // server answers 403 for them and the catalog silently falls back to system faces.
    fs: { allow: [repoRoot] },
  },
});
