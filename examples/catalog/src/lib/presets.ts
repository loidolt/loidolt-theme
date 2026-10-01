/** The built-in presets `app.css` imports, default first. */
export const presets = ['loidolt', 'soft', 'compact'] as const;
export type PresetName = (typeof presets)[number];

export const schemes = ['light', 'dark'] as const;
export type Scheme = (typeof schemes)[number];

/** Where the chrome-less sampler for one preset in one scheme lives, relative to the base path. */
export const previewPath = (preset: PresetName, scheme: Scheme) => `/preview/${preset}/${scheme}`;

/**
 * Reads a preview path back, or `null` for any other page. Only known presets and schemes match,
 * so the result is safe to write straight into markup.
 */
export function parsePreview(pathname: string): { preset: PresetName; scheme: Scheme } | null {
  const match = /^\/preview\/([a-z0-9-]+)\/([a-z]+)\/?$/.exec(pathname);
  if (!match) return null;
  const [, preset, scheme] = match;
  const isPreset = (presets as readonly string[]).includes(preset);
  const isScheme = (schemes as readonly string[]).includes(scheme);
  return isPreset && isScheme ? { preset: preset as PresetName, scheme: scheme as Scheme } : null;
}
