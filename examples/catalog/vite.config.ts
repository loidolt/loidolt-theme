import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The workspace root, two levels up from examples/catalog.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Vite's default 5173 is shared by every other JS dev server on this machine, so a browser tab
// left open from a previous project replays *its* cached module graph against whichever server
// answers next — which surfaces as `outside of Vite serving allow list` for foreign paths.
// Claiming a dedicated port keeps the catalog's origin its own.
const DEFAULT_PORT = 5373;
const requestedPort = Number(process.env.LOIDOLT_CATALOG_PORT);
const port =
  Number.isInteger(requestedPort) && requestedPort > 0 && requestedPort <= 65_535
    ? requestedPort
    : DEFAULT_PORT;

export default defineConfig({
  plugins: [sveltekit()],
  // MapLibre's worker uses code splitting, which only the ES worker format supports.
  worker: { format: 'es' },
  server: {
    port,
    strictPort: true,
    // The font files live in packages/styles, outside this app's root; without this the dev
    // server answers 403 for them and the catalog silently falls back to system faces.
    fs: { allow: [repoRoot] },
  },
});
