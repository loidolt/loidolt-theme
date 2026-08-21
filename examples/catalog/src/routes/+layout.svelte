<script lang="ts">
  import '../app.css';
  import { base } from '$app/paths';
  import { page } from '$app/state';
  import {
    AppShell,
    Badge,
    Brand,
    breakpointQuery,
    createMediaQuery,
    Drawer,
    Sidebar,
    ThemeToggle,
    TooltipProvider,
    Topbar,
    Workspace,
  } from '@loidolt/theme-svelte';
  import { version } from '@loidolt/theme-svelte/package.json' with { type: 'json' };
  import { grouped } from '$lib/registry.js';
  import { theme } from '$lib/theme.js';

  let { children } = $props();

  /*
   * The site is its own first consumer: below the compact breakpoint the navigation column
   * becomes a Drawer, exactly as an application would do it.
   */
  const compact = createMediaQuery(breakpointQuery('compact'));
  let navOpen = $state(false);

  const sections = [
    { href: `${base}/`, label: 'Overview' },
    { href: `${base}/foundations`, label: 'Foundations' },
    { href: `${base}/patterns`, label: 'Patterns' },
    { href: `${base}/components`, label: 'Components' },
  ];

  const current = $derived(page.url.pathname.replace(/\/$/, ''));
  const isCurrent = (href: string) => current === href.replace(/\/$/, '');
</script>

<svelte:head><title>Loidolt Theme</title></svelte:head>

<a class="ldt-skip-link" href="#docs-content">Skip to content</a>

<TooltipProvider>
  <AppShell mainId="docs-content">
    {#snippet header()}
      <Topbar navLabel="Documentation">
        {#snippet brand()}
          <Brand name="Loidolt" meta={`Theme ${version}`} href={`${base}/`} />
        {/snippet}
        {#snippet navigation()}
          {#each sections as section (section.href)}
            <a
              class="docs-nav-link"
              href={section.href}
              aria-current={isCurrent(section.href) ? 'page' : undefined}>{section.label}</a
            >
          {/each}
        {/snippet}
        {#snippet actions()}
          <Badge variant="accent">Svelte 5</Badge>
          <ThemeToggle {theme} />
          {#if compact.matches}
            <Drawer title="Components" bind:open={navOpen} triggerClass="ldt-button ldt-button--sm">
              {#snippet trigger()}Browse{/snippet}
              {@render componentNav()}
            </Drawer>
          {/if}
        {/snippet}
      </Topbar>
    {/snippet}

    <Workspace sidebarOpen={!compact.matches}>
      {#snippet sidebar()}
        <Sidebar label="Components">{@render componentNav()}</Sidebar>
      {/snippet}
      <div class="docs-page">{@render children()}</div>
    </Workspace>

    {#snippet footer()}
      <div class="docs-footer">Loidolt Theme · Svelte 5 · Jost + Archivo · MIT</div>
    {/snippet}
  </AppShell>
</TooltipProvider>

{#snippet componentNav()}
  <nav class="docs-sidenav" aria-label="Components">
    {#each grouped as section (section.group)}
      <p class="ldt-eyebrow">{section.group}</p>
      <ul>
        {#each section.items as item (item.slug)}
          {@const href = `${base}/components/${item.slug}`}
          <li>
            <a
              {href}
              aria-current={isCurrent(href) ? 'page' : undefined}
              onclick={() => (navOpen = false)}>{item.name}</a
            >
          </li>
        {/each}
      </ul>
    {/each}
  </nav>
{/snippet}
