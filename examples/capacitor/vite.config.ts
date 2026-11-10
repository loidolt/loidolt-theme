import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Capacitor copies the built `dist/` into the native project (`npm run ios:sync`); the native
// project itself is left out of the watcher.
export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: { port: 5175, strictPort: true, watch: { ignored: ['**/ios/**'] } },
  build: { target: 'es2022' },
});
