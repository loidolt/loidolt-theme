import { svelte } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';

// Tauri loads the dev server in its window (`devUrl` in src-tauri/tauri.conf.json) and the built
// `dist/` in a release, so the port is fixed and Rust's own output is left out of the watcher.
export default defineConfig({
  plugins: [svelte()],
  clearScreen: false,
  server: {
    port: 5174,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  build: { target: 'es2022' },
});
