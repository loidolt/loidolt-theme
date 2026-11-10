<script lang="ts">
  import { TextZoom } from '@capacitor/text-zoom';
  import { untrack } from 'svelte';
  import { Badge, Button, Section } from '@loidolt/theme-svelte';
  import type { CapacitorSetup } from '@loidolt/theme-capacitor';
  import { log, makeTone, router } from '../lib.svelte.js';

  let { native }: { native: CapacitorSetup } = $props();

  let copied = $state('');
  let zoom = $state('');
  let haptics = $state('');
  let pauses = $state(0);
  let player = $state<HTMLAudioElement>();
  const tone = URL.createObjectURL(makeTone());

  async function readZoom() {
    try {
      const [preferred, current] = await Promise.all([TextZoom.getPreferred(), TextZoom.get()]);
      zoom = `preferred ${preferred.value}, applied ${current.value}`;
    } catch (error) {
      zoom = String(error);
    }
    log('text-zoom', zoom);
  }

  $effect(() => {
    void readZoom();
    // Re-read when the app comes back, after Settings changed the size.
    if (native.lifecycle?.active) setTimeout(readZoom, 300);
  });

  $effect(() => {
    const active = native.lifecycle?.active;
    untrack(() => {
      if (active === false) pauses++;
      log('lifecycle', { active, paused: player?.paused });
    });
  });

  async function copy() {
    try {
      await navigator.clipboard.writeText('Copied from the example app');
      copied = 'Copied';
    } catch (error) {
      copied = `threw ${String(error)}`;
    }
    log('copy', copied);
  }

  async function buzz() {
    const h = native.haptics;
    if (!h) return (haptics = 'no haptics adapter');
    try {
      await h.impact('light');
      await h.impact('heavy');
      await h.selection();
      await h.notify('success');
      await h.notify('error');
      haptics = 'All five played without an error';
    } catch (error) {
      haptics = `threw ${String(error)}`;
    }
    log('haptics', haptics);
  }
</script>

<Section title="Links and clipboard" headingLevel={1}>
  <p>
    <a href="https://capacitorjs.com/docs">An external link</a> opens in the in-app browser, in the
    theme's colour. <a href="/files">An internal one</a> stays in the app.
  </p>
  <div class="ldt-cluster">
    <Button onclick={copy}>Copy some text</Button>
    {#if copied}<span role="status">{copied}</span>{/if}
  </div>
</Section>

<Section title="Network" headingLevel={2}>
  <p>
    Turn the Mac's network off and on: an offline toast, then a back-online one.
    <Badge variant={native.network?.connected ? 'success' : 'warning'}
      >{native.network?.connected ? 'Online' : 'Offline'} · {native.network?.type}</Badge
    >
  </p>
</Section>

<Section title="Lifecycle" headingLevel={2}>
  <p>
    Play the tone, go Home, come back: it is paused. Backgrounded {pauses}
    {pauses === 1 ? 'time' : 'times'}.
    <Badge>{native.lifecycle?.active ? 'Active' : 'Background'}</Badge>
  </p>
  <audio bind:this={player} src={tone} controls loop></audio>
</Section>

<Section title="Deep links" headingLevel={2}>
  <p>
    <code>xcrun simctl openurl booted ldtexample://share</code> lands on the Share screen, whether
    the app was running or not. Current path: <code>{router.full}</code>
  </p>
</Section>

<Section title="Text size" headingLevel={2}>
  <p>Change the text size in Settings and come back: the page follows. {zoom}</p>
</Section>

<Section title="Haptics" headingLevel={2}>
  <p>The simulator has no haptics; the calls should still resolve.</p>
  <div class="ldt-cluster">
    <Button onclick={buzz} data-haptic>Play the patterns</Button>
    {#if haptics}<span role="status">{haptics}</span>{/if}
  </div>
</Section>
