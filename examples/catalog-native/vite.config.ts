import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

// The workspace root, two levels up: the catalog's source and the theme's fonts live outside
// this package, and the dev server has to be allowed to serve them.
const repoRoot = fileURLToPath(new URL('../..', import.meta.url));

// Every page, component and demo is the catalog's own: this package only swaps the shell.
const catalog = '../catalog/src';

// Capacitor copies the built `dist/` into the native project (`npm run ios:sync`). For live
// reload, `LDT_DEV=http://<this Mac's address>:5376 npm run ios:sync` points the app here.
export default defineConfig({
  plugins: [
    sveltekit({
      preprocess: vitePreprocess(),
      /*
       * A single-page build. Capacitor's iOS server answers any path without an extension with the
       * root `index.html`, so prerendered pages would hydrate under the wrong URL on a reload or a
       * deep link. With nothing prerendered, `index.html` is the client-rendered shell for every
       * route.
       */
      adapter: adapter({ pages: 'dist', assets: 'dist', fallback: 'index.html', strict: false }),
      prerender: { entries: [], handleUnseenRoutes: 'ignore' },
      paths: { relative: false },
      // SvelteKit 3 dropped `files.lib`, and #lib can't point outside this package, so $lib stays an
      // alias for the catalog's own.
      alias: { $lib: `${catalog}/lib` },
      files: {
        routes: `${catalog}/routes`,
        assets: '../catalog/static',
        hooks: { server: `${catalog}/hooks.server.ts`, client: 'src/hooks.client.ts' },
        appTemplate: 'src/app.html',
      },
    }),
  ],
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
