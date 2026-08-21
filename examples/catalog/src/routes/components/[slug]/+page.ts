import { error } from '@sveltejs/kit';
import { bySlug } from '$lib/registry.js';

export const prerender = true;

/**
 * Static export: every component page is listed from the registry rather than crawled, so a
 * page nothing links to is still built, and a slug that disappears fails the build loudly.
 */
export function entries() {
  return [...bySlug.keys()].map((slug) => ({ slug }));
}

export function load({ params }: { params: { slug: string } }) {
  const entry = bySlug.get(params.slug);
  if (!entry) error(404, `Unknown component: ${params.slug}`);
  return { entry };
}
