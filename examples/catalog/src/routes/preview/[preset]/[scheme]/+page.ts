import { error } from '@sveltejs/kit';
import { builtInPresets } from '@loidolt/theme-tokens';
import { parsePreview, presets, schemes } from '$lib/presets.js';

export const prerender = true;

/** Every preset in every scheme, built ahead of time like the rest of the site. */
export function entries() {
  return presets.flatMap((preset) => schemes.map((scheme) => ({ preset, scheme })));
}

export function load({ params }: { params: { preset: string; scheme: string } }) {
  const preview = parsePreview(`/preview/${params.preset}/${params.scheme}`);
  const preset = builtInPresets.find((candidate) => candidate.name === preview?.preset);
  if (!preview || !preset) error(404, `Unknown preview: ${params.preset} / ${params.scheme}`);
  return { scheme: preview.scheme, label: preset.label, description: preset.description };
}
