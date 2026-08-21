import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ pages: 'dist', assets: 'dist', strict: true }),
    /*
     * Absolute asset paths. The site is served from the root of its own domain, and the 404 page
     * has to work at *any* depth — with relative paths, `404.html` served for /a/b/c would look
     * for its stylesheet under /a/b/_app and find nothing.
     */
    paths: { relative: false },
  },
};

export default config;
