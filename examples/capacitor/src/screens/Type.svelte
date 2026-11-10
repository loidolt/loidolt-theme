<script lang="ts">
  import { Field, Input, Section, Textarea } from '@loidolt/theme-svelte';
  import type { CapacitorSetup } from '@loidolt/theme-capacitor';
  import { log } from '../lib.svelte.js';

  let { native }: { native: CapacitorSetup } = $props();

  let attribute = $state('');
  let height = $state('');

  // What the stylesheet sees, refreshed as the keyboard comes and goes.
  $effect(() => {
    const visible = native.keyboard?.visible;
    const root = document.documentElement;
    attribute = root.dataset.keyboard ?? '(none)';
    height = root.style.getPropertyValue('--ldt-keyboard-height') || '(unset)';
    log('keyboard', {
      visible,
      attribute,
      height,
      inset: root.style.getPropertyValue('--ldt-keyboard-inset'),
    });
  });

  let name = $state('');
  let message = $state('');
</script>

<Section title="Keyboard" headingLevel={1}>
  <p>
    Focus the field at the bottom. The tab bar steps aside while typing, the field stays in view,
    and everything comes back when the keyboard goes. The keyboard's appearance follows the theme.
  </p>
  <dl class="readout" aria-live="polite">
    <dt>Visible</dt>
    <dd>{native.keyboard?.visible ?? 'no keyboard adapter'}</dd>
    <dt>Height</dt>
    <dd>{native.keyboard?.height ?? 0}px</dd>
    <dt>data-keyboard</dt>
    <dd><code>{attribute}</code></dd>
    <dt>--ldt-keyboard-height</dt>
    <dd><code>{height}</code></dd>
  </dl>
  <div class="spacer" aria-hidden="true"></div>
  <Field label="Message">
    {#snippet children({ id, describedBy })}
      <Textarea {id} aria-describedby={describedBy} bind:value={message} rows={3} />
    {/snippet}
  </Field>
  <Field label="Name" description="The last field on the page, right above the tab bar.">
    {#snippet children({ id, describedBy })}
      <Input {id} aria-describedby={describedBy} bind:value={name} autocomplete="name" />
    {/snippet}
  </Field>
</Section>

<style>
  .readout {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--loidolt-space-1) var(--loidolt-space-4);
    margin: 0;
  }
  .readout dd {
    margin: 0;
  }
  .spacer {
    min-height: 28vh;
  }
</style>
