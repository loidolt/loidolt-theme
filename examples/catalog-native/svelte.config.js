import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Every page, component and demo is the catalog's own: this package only swaps the shell.
const catalog = '../catalog/src';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    /*
     * A single-page build. Capacitor's iOS server answers any path without an extension with the
     * root `index.html`, so prerendered pages would hydrate under the wrong URL on a reload or a
     * deep link. With nothing prerendered, `index.html` is the client-rendered shell for every
     * route.
     */
    adapter: adapter({ pages: 'dist', assets: 'dist', fallback: 'index.html', strict: false }),
    prerender: { entries: [], handleUnseenRoutes: 'ignore' },
    paths: { relative: false },
    files: {
      routes: `${catalog}/routes`,
      lib: `${catalog}/lib`,
      assets: '../catalog/static',
      hooks: { server: `${catalog}/hooks.server.ts`, client: 'src/hooks.client.ts' },
      appTemplate: 'src/app.html',
    },
  },
};

export default config;
