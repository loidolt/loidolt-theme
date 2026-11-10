<script lang="ts">
  import * as notification from '@tauri-apps/plugin-notification';
  import * as os from '@tauri-apps/plugin-os';
  import {
    AppShell,
    Badge,
    Brand,
    Button,
    createTheme,
    createToaster,
    PageHeader,
    Section,
    ThemeToggle,
    Toast,
    ToastViewport,
    Topbar,
  } from '@loidolt/theme-svelte';
  import { setupTauri } from '@loidolt/theme-tauri';

  const theme = createTheme();

  const toaster = createToaster({ duration: 6000 });

  // In a browser (`npm run dev`) this is inert: platform is null and <html> is left alone.
  // Notifications fall back to the Web Notifications API there, and to a toast without either.
  const desktop = setupTauri({ plugins: { os, notification }, notifications: { toaster } });

  const names = {
    macos: 'macOS',
    windows: 'Windows',
    linux: 'Linux',
    ios: 'iOS',
    android: 'Android',
  } as const;
  const where = desktop.platform ? `A Tauri window on ${names[desktop.platform]}` : 'A browser';

  let count = $state(0);
  let sent = $state<boolean | null>(null);

  async function notifyLater() {
    // Ask on the click itself: a prompt no user gesture asked for is ignored by browsers.
    await desktop.notifications?.requestPermission();
    sent = null;
    setTimeout(async () => {
      sent =
        (await desktop.notifications?.notify({
          title: 'Export finished',
          body: 'The file is ready in your downloads.',
        })) ?? false;
    }, 3000);
  }
</script>

<AppShell mainId="main">
  {#snippet header()}
    <Topbar navLabel="Example app">
      {#snippet brand()}<Brand name="Theme example" meta="Desktop" />{/snippet}
      {#snippet actions()}<ThemeToggle {theme} />{/snippet}
    </Topbar>
  {/snippet}
  <div class="ldt-stack example-page">
    <PageHeader
      eyebrow="@loidolt/theme-tauri"
      title="One layout, browser and window."
      description="The same root layout runs in a browser and in a Tauri window; the desktop adapters only switch on inside the window."
      headingLevel={1}
    />
    <Section title="Running in" headingLevel={2}>
      <p>
        <Badge variant={desktop.platform ? 'success' : 'default'}>{where}</Badge>
      </p>
      <p>
        Inside a window, <code>&lt;html&gt;</code> carries
        <code>data-tauri-platform</code>, and button labels like the one below stop being
        selectable, as in a native app.
      </p>
      <Button variant="primary" onclick={() => count++}>Clicked {count} times</Button>
    </Section>
    <Section title="Notifications" headingLevel={2}>
      <p>
        Permission: <Badge>{desktop.notifications?.permission ?? 'off'}</Badge>
        {#if sent !== null}
          <Badge variant={sent ? 'success' : 'warning'}
            >{sent ? 'Sent to the OS' : 'Shown as a toast'}</Badge
          >
        {/if}
      </p>
      <p>Switch to another app after clicking: the notification arrives three seconds later.</p>
      <Button onclick={notifyLater}>Notify in 3 seconds</Button>
    </Section>
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
    padding: var(--loidolt-space-6);
  }
</style>
