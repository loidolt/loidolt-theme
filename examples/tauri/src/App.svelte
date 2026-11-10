<script lang="ts">
  import * as os from '@tauri-apps/plugin-os';
  import {
    AppShell,
    Badge,
    Brand,
    Button,
    createTheme,
    PageHeader,
    Section,
    ThemeToggle,
    Topbar,
  } from '@loidolt/theme-svelte';
  import { setupTauri } from '@loidolt/theme-tauri';

  const theme = createTheme();

  // In a browser (`npm run dev`) this is inert: platform is null and <html> is left alone.
  const desktop = setupTauri({ plugins: { os } });

  const names = {
    macos: 'macOS',
    windows: 'Windows',
    linux: 'Linux',
    ios: 'iOS',
    android: 'Android',
  } as const;
  const where = desktop.platform ? `A Tauri window on ${names[desktop.platform]}` : 'A browser';

  let count = $state(0);
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
  </div>
</AppShell>

<style>
  .example-page {
    padding: var(--loidolt-space-6);
  }
</style>
