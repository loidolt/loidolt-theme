import { sveltekit } from '@sveltejs/kit/vite';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The workspace root, two levels up: the catalog's source and the theme's fonts live outside
// this package, and the dev server has to be allowed to serve them.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Capacitor copies the built `dist/` into the native project (`npm run ios:sync`). For live
// reload, `LDT_DEV=http://<this Mac's address>:5376 npm run ios:sync` points the app here.
export default defineConfig({
  plugins: [sveltekit()],
  // MapLibre's worker uses code splitting, which only the ES worker format supports.
  worker: { format: 'es' },
  clearScreen: false,
  server: {
    port: 5376,
    strictPort: true,
    fs: { allow: [repoRoot] },
    watch: { ignored: ['**/ios/**'] },
  },
});
