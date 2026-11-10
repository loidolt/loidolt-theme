<script lang="ts">
  import {
    readRoleColor,
    Button,
    Dialog,
    Drawer,
    PresetPicker,
    Section,
    ThemeToggle,
  } from '@loidolt/theme-svelte';
  import { systemBarStyleFor } from '@loidolt/theme-capacitor';
  import { log, theme } from '../lib.svelte.js';

  let probe = $state<HTMLDivElement>();
  let insets = $state({ top: 0, right: 0, bottom: 0, left: 0 });
  let barStyle = $state('');

  // What the safe-area knobs resolve to, read from a probe padded by them.
  function measure() {
    if (!probe) return;
    const style = getComputedStyle(probe);
    insets = {
      top: parseFloat(style.paddingTop),
      right: parseFloat(style.paddingRight),
      bottom: parseFloat(style.paddingBottom),
      left: parseFloat(style.paddingLeft),
    };
    const surface = readRoleColor(document.documentElement, 'surface') ?? '';
    barStyle = surface ? `${systemBarStyleFor(surface)} (surface ${surface.slice(0, 7)})` : '';
    const root = getComputedStyle(document.documentElement);
    const topbar = document.querySelector('.ldt-topbar');
    log('chrome', {
      insets,
      knob: root.getPropertyValue('--ldt-safe-top'),
      injected: root.getPropertyValue('--safe-area-inset-top'),
      topbar: topbar ? getComputedStyle(topbar).paddingTop : null,
      barStyle,
      preference: theme.preference,
      preset: theme.preset,
    });
  }

  $effect(() => {
    // Re-measure on every theme or preset change and on rotation.
    void theme.resolved;
    void theme.preset;
    requestAnimationFrame(measure);
    // WKWebView reports the safe areas a moment after the first layout at launch.
    const later = setTimeout(measure, 600);
    const onResize = () => requestAnimationFrame(measure);
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(later);
      window.removeEventListener('resize', onResize);
    };
  });

  let dialogOpen = $state(false);
</script>

<Section title="Theme" headingLevel={1}>
  <p>
    The status bar icons follow the surface colour under them: light on dark, dark on light. Switch
    the scheme or the preset and they follow at once. Kill and relaunch the app: the choice comes
    back from native storage.
  </p>
  <div class="ldt-cluster">
    <ThemeToggle {theme} showSystem />
    <PresetPicker {theme} label="Preset" />
  </div>
  <dl class="readout">
    <dt>Preference</dt>
    <dd>{theme.preference} → {theme.resolved}</dd>
    <dt>Preset</dt>
    <dd>{theme.preset}</dd>
    <dt>Bar style</dt>
    <dd>{barStyle}</dd>
  </dl>
</Section>

<Section title="Safe areas" headingLevel={2}>
  <p>
    The top bar clears the status bar and the Dynamic Island; the tab bar clears the home indicator.
    Rotate the device: the side insets take over.
  </p>
  <div bind:this={probe} class="probe" aria-hidden="true"></div>
  <dl class="readout">
    <dt>Top</dt>
    <dd>{insets.top}px</dd>
    <dt>Right</dt>
    <dd>{insets.right}px</dd>
    <dt>Bottom</dt>
    <dd>{insets.bottom}px</dd>
    <dt>Left</dt>
    <dd>{insets.left}px</dd>
  </dl>
</Section>

<Section title="Overlays" headingLevel={2}>
  <p>A dialog and a drawer, for focus order and focus return.</p>
  <div class="ldt-cluster">
    <Dialog
      bind:open={dialogOpen}
      title="A dialog"
      description="Focus moves in, stays in, and returns to the button that opened it."
    >
      {#snippet trigger()}Open a dialog{/snippet}
      <p>Swipe through it with VoiceOver: the title, this text, then the buttons.</p>
      {#snippet footer()}
        <Button onclick={() => (dialogOpen = false)}>Cancel</Button>
        <Button variant="primary" onclick={() => (dialogOpen = false)}>Done</Button>
      {/snippet}
    </Dialog>
    <Drawer title="A drawer" side="bottom">
      {#snippet trigger()}Open a drawer{/snippet}
      <p>Drawers clear the home indicator too.</p>
    </Drawer>
  </div>
</Section>

<style>
  .probe {
    position: absolute;
    visibility: hidden;
    padding: var(--ldt-safe-top) var(--ldt-safe-right) var(--ldt-safe-bottom) var(--ldt-safe-left);
  }
  .readout {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--loidolt-space-1) var(--loidolt-space-4);
    margin: 0;
  }
  .readout dt {
    color: var(--loidolt-text-muted);
  }
  .readout dd {
    margin: 0;
    font-variant-numeric: tabular-nums;
  }
</style>
