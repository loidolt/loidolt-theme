<script lang="ts">
  import '../app.css';
  import '$lib/loaders.js';
  import { tick } from 'svelte';
  import { SvelteMap } from 'svelte/reactivity';
  import { afterNavigate, goto } from '$app/navigation';
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
    PresetPicker,
    ThemeToggle,
    TooltipProvider,
    Topbar,
    Workspace,
  } from '@loidolt/theme-svelte';
  import { version } from '@loidolt/theme-svelte/package.json' with { type: 'json' };
  import { entries, grouped } from '$lib/registry.js';
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
    { href: `${base}/presets`, label: 'Presets' },
    { href: `${base}/patterns`, label: 'Patterns' },
    { href: `${base}/components`, label: 'Components' },
  ];

  const current = $derived(page.url.pathname.replace(/\/$/, ''));
  const isCurrent = (href: string) => current === href.replace(/\/$/, '');

  /*
   * The component index is long — over a hundred entries in a dozen groups — so the nav column
   * is an outline: every group collapses to its name and count, the one holding the current page
   * opens itself, and a filter narrows the whole list at once.
   */
  const componentHref = (slug: string) => `${base}/components/${slug}`;
  const currentGroup = $derived(
    entries.find((entry) => isCurrent(componentHref(entry.slug)))?.group
  );
  // Groups the reader opened or closed by hand; any other follows the page, open only if current.
  const toggled = new SvelteMap<string, boolean>();
  const isOpen = (group: string) => toggled.get(group) ?? group === currentGroup;

  let query = $state('');
  let filterInput = $state<HTMLInputElement | null>(null);
  const fold = (text: string) =>
    text
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase();
  const needle = $derived(fold(query.trim()));
  const filtered = $derived(
    needle
      ? grouped
          .map((section) => ({
            ...section,
            // A group name only counts from its start: "dia" should not pull in all of Media.
            items: fold(section.group).startsWith(needle)
              ? section.items
              : section.items.filter((item) => fold(item.name).includes(needle)),
          }))
          .filter((section) => section.items.length > 0)
      : grouped
  );
  const matches = $derived(filtered.reduce((total, section) => total + section.items.length, 0));
  // Where Enter goes: an exact name, then a name that starts with the query, then the first hit.
  const best = $derived.by(() => {
    const items = filtered.flatMap((section) => section.items);
    const rank = (name: string) => (name === needle ? 0 : name.startsWith(needle) ? 1 : 2);
    return items.reduce<(typeof items)[number] | undefined>(
      (top, item) => (!top || rank(fold(item.name)) < rank(fold(top.name)) ? item : top),
      undefined
    );
  });

  function onFilterKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && needle && best) {
      event.preventDefault();
      navOpen = false;
      void goto(componentHref(best.slug));
    } else if (event.key === 'Escape' && query) {
      // Clearing comes first; a second Escape is left to the drawer, which closes on it.
      event.stopPropagation();
      query = '';
    }
  }

  // `/` jumps to the filter from anywhere that is not already taking text.
  function onWindowKeydown(event: KeyboardEvent) {
    if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'))
      return;
    if (!filterInput) return;
    event.preventDefault();
    filterInput.focus();
    filterInput.select();
  }

  // Bring the current entry into view in the nav column or drawer, without moving the page.
  function revealCurrent() {
    const link = document.querySelector<HTMLElement>('.docs-sidenav [aria-current="page"]');
    const column = link?.closest<HTMLElement>('.docs-sidenav__groups');
    if (!link || !column) return;
    const linkBox = link.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();
    if (linkBox.top < columnBox.top || linkBox.bottom > columnBox.bottom) {
      column.scrollTop += linkBox.top - columnBox.top - column.clientHeight / 3;
    }
  }

  afterNavigate(async () => {
    // Arriving in a group always shows it, even one collapsed by hand earlier.
    if (currentGroup) toggled.delete(currentGroup);
    await tick();
    revealCurrent();
  });

  $effect(() => {
    if (!navOpen) return;
    const frame = requestAnimationFrame(revealCurrent);
    return () => cancelAnimationFrame(frame);
  });

  /*
   * The nav column sticks below the top bar and scrolls on its own. The bar wraps at in-between
   * widths, so its height is measured rather than assumed.
   */
  let headerEl = $state<HTMLElement | null>(null);
  let headerHeight = $state(0);
  $effect(() => {
    if (!headerEl) return;
    const observer = new ResizeObserver(() => (headerHeight = headerEl?.offsetHeight ?? 0));
    observer.observe(headerEl);
    return () => observer.disconnect();
  });

  // Preset preview frames on /presets are bare pages: no chrome, nothing but the sampler.
  const previewing = $derived(page.route.id === '/preview/[preset]/[scheme]');
</script>

<svelte:head><title>Loidolt Theme</title></svelte:head>
<svelte:window onkeydown={onWindowKeydown} />

{#if previewing}
  {@render children()}
{:else}
  <a class="ldt-skip-link" href="#docs-content">Skip to content</a>

  <TooltipProvider>
    <AppShell mainId="docs-content" style={`--docs-header-height: ${headerHeight}px`}>
      {#snippet header()}
        <Topbar navLabel="Documentation" bind:ref={headerEl}>
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
            <!-- First, so the way into the nav never scrolls out of reach on a phone. -->
            {#if compact.matches}
              <Drawer
                title="Components"
                bind:open={navOpen}
                triggerClass="ldt-button ldt-button--sm"
              >
                {#snippet trigger()}Browse{/snippet}
                {@render componentNav()}
              </Drawer>
            {/if}
            <Badge variant="accent">Svelte 5</Badge>
            <PresetPicker {theme} variant="select" />
            <ThemeToggle {theme} />
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
{/if}

{#snippet componentNav()}
  <nav class="docs-sidenav" aria-label="Components">
    <div class="docs-sidenav__search">
      <div class="docs-sidenav__field">
        <input
          bind:this={filterInput}
          bind:value={query}
          class="docs-sidenav__filter"
          type="search"
          placeholder="Filter components"
          aria-label="Filter components"
          aria-describedby="docs-sidenav-count"
          autocomplete="off"
          spellcheck="false"
          onkeydown={onFilterKeydown}
        />
        {#if !query}<kbd class="docs-sidenav__hint" aria-hidden="true">/</kbd>{/if}
      </div>
    </div>
    <p id="docs-sidenav-count" class="docs-sidenav__status" aria-live="polite">
      {#if needle}
        {matches === 0 ? 'No matches' : `${matches} of ${entries.length}`}
      {:else}
        {entries.length} components
      {/if}
    </p>

    <div class="docs-sidenav__groups">
      {#each filtered as section (section.group)}
        <details
          class="docs-sidenav__group"
          open={needle ? true : isOpen(section.group)}
          ontoggle={(event) => {
            // While filtering every group is forced open; that is not the reader's choice to keep.
            const open = event.currentTarget.open;
            if (!needle && open !== isOpen(section.group)) toggled.set(section.group, open);
          }}
        >
          <summary aria-current={section.group === currentGroup ? 'true' : undefined}>
            <span>{section.group}</span>
            <span class="docs-sidenav__count">{section.items.length}</span>
          </summary>
          <ul>
            {#each section.items as item (item.slug)}
              {@const href = componentHref(item.slug)}
              <li>
                <a
                  {href}
                  aria-current={isCurrent(href) ? 'page' : undefined}
                  onclick={() => (navOpen = false)}>{item.name}</a
                >
              </li>
            {/each}
          </ul>
        </details>
      {/each}
    </div>
  </nav>
{/snippet}
