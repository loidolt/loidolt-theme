<script lang="ts">
  import { base } from '$app/paths';
  import { Button, PageHeader, Section } from '@loidolt/theme-svelte';
  import { builtInPresets } from '@loidolt/theme-tokens';
  import { previewPath, schemes, type PresetName } from '$lib/presets.js';
  import { theme } from '$lib/theme.js';
</script>

<svelte:head><title>Presets — Loidolt Theme</title></svelte:head>

<PageHeader
  eyebrow="Presets"
  title="Every style set, side by side."
  description="Each frame is a real page rendered under one preset in one scheme, whatever this site is set to. Pick one to restyle the whole catalog."
  headingLevel={1}
/>

{#each builtInPresets as preset (preset.name)}
  {@const name = preset.name as PresetName}
  {@const inUse = theme.preset === name}
  <Section title={preset.label} headingLevel={2}>
    {#snippet actions()}
      <Button
        size="sm"
        variant={inUse ? 'primary' : 'quiet'}
        aria-pressed={inUse}
        onclick={() => (theme.preset = name)}>{inUse ? 'In use' : 'Use on this site'}</Button
      >
    {/snippet}
    {#if preset.description}<p class="docs-note">{preset.description}</p>{/if}
    <div class="docs-preset-frames">
      {#each schemes as scheme (scheme)}
        {@const href = `${base}${previewPath(name, scheme)}`}
        <figure class="docs-preset-frame">
          <iframe src={href} title={`${preset.label} preset, ${scheme} scheme`} loading="lazy"
          ></iframe>
          <figcaption>
            <span>{scheme}</span>
            <a {href} target="_blank" rel="noopener">Open full page</a>
          </figcaption>
        </figure>
      {/each}
    </div>
  </Section>
{/each}
