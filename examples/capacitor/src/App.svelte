<script lang="ts">
  import { App } from '@capacitor/app';
  import { Browser } from '@capacitor/browser';
  import { Clipboard } from '@capacitor/clipboard';
  import { Filesystem } from '@capacitor/filesystem';
  import { Haptics } from '@capacitor/haptics';
  import { Keyboard } from '@capacitor/keyboard';
  import { Network } from '@capacitor/network';
  import { Preferences } from '@capacitor/preferences';
  import { Share } from '@capacitor/share';
  import { SplashScreen } from '@capacitor/splash-screen';
  import { TextZoom } from '@capacitor/text-zoom';
  import { FilePicker } from '@capawesome/capacitor-file-picker';
  import {
    AppShell,
    Badge,
    Brand,
    TabBar,
    ThemeToggle,
    Toast,
    ToastViewport,
    Topbar,
  } from '@loidolt/theme-svelte';
  import { nativePlatform, setupCapacitor } from '@loidolt/theme-capacitor';
  import { log, router, screens, theme, toaster } from './lib.svelte.js';
  import Chrome from './screens/Chrome.svelte';
  import Files from './screens/Files.svelte';
  import ShareScreen from './screens/Share.svelte';
  import System from './screens/System.svelte';
  import Type from './screens/Type.svelte';

  // Once, in the root: every adapter, each turned on by the plugin handed to it.
  const native = setupCapacitor({
    plugins: {
      App,
      Browser,
      Clipboard,
      FilePicker,
      Filesystem,
      Haptics,
      Keyboard,
      Network,
      Preferences,
      Share,
      SplashScreen,
      TextZoom,
    },
    theme,
    toaster,
    navigate: router.navigate,
  });

  const started = performance.now();
  native.ready.then(() =>
    log('ready', {
      ms: Math.round(performance.now() - started),
      preference: theme.preference,
      preset: theme.preset,
    })
  );
  log('launch', { platform: nativePlatform(), path: router.full });

  const tabs = $derived(
    screens.map((screen) => ({
      label: screen.label,
      href: screen.path,
      current: router.path === screen.path,
    }))
  );
  const title = $derived(
    screens.find((screen) => screen.path === router.path)?.label ?? 'Not found'
  );
</script>

<AppShell mainId="main">
  {#snippet header()}
    <Topbar navLabel="Example app">
      {#snippet brand()}<Brand name="Theme example" meta={title} />{/snippet}
      {#snippet actions()}
        <Badge>{nativePlatform() ?? 'web'}</Badge>
        <ThemeToggle {theme} />
      {/snippet}
    </Topbar>
  {/snippet}
  {#snippet tabBar()}
    <TabBar items={tabs} label="Screens" />
  {/snippet}
  <div class="ldt-stack example-page">
    {#if router.path === '/'}
      <Chrome />
    {:else if router.path === '/share'}
      <ShareScreen {native} />
    {:else if router.path === '/files'}
      <Files {native} />
    {:else if router.path === '/type'}
      <Type {native} />
    {:else if router.path === '/system'}
      <System {native} />
    {:else}
      <p>
        Nothing at <code>{router.full}</code>. A deep link landed here; the screens are below.
      </p>
    {/if}
  </div>
</AppShell>

<ToastViewport
  onpointerenter={toaster.pause}
  onpointerleave={toaster.resume}
  onfocusin={toaster.pause}
  onfocusout={toaster.resume}
>
  {#each toaster.toasts as toast (toast.id)}
    <Toast {...toast} onDismiss={() => toaster.dismiss(toast.id)} />
  {/each}
</ToastViewport>

<style>
  .example-page {
    padding: var(--loidolt-space-5) var(--loidolt-space-4);
  }
</style>
