<script lang="ts">
  import {
    Alert,
    AppShell,
    Badge,
    Brand,
    Button,
    Card,
    Checkbox,
    ContextBar,
    Dialog,
    DropdownMenu,
    Field,
    IconButton,
    Input,
    Label,
    NavMenu,
    NumberField,
    PageHeader,
    Panel,
    Popover,
    Progress,
    RadioGroup,
    Section,
    Select,
    Separator,
    Sidebar,
    Skeleton,
    Spinner,
    Switch,
    Table,
    Tabs,
    Textarea,
    Toast,
    ToastViewport,
    Tooltip,
    TooltipProvider,
    Topbar,
    Workspace,
    createToaster,
  } from '@loidolt/theme-svelte';
  import * as theme from '@loidolt/theme-svelte';
  import { colors, semantic } from '@loidolt/theme-tokens';
  import { version } from '@loidolt/theme-svelte/package.json' with { type: 'json' };

  // Derived from the barrel rather than hand-counted, so the stat cannot go stale.
  const componentCount = Object.keys(theme).filter(
    (name) => /^[A-Z]/.test(name) && !name.endsWith('Primitive')
  ).length;

  let email = $state('studio@loidolt.com');
  let brokenEmail = $state('studio@');
  let notes = $state('Clean materials, exact dimensions, useful tools.');
  let format = $state<'svg' | 'pdf' | 'png' | ''>('svg');
  let mode = $state('design');
  let enabled = $state(true);
  let guides = $state(true);
  let layers = $state(12);
  let dark = $state(false);
  let selectedMenu = $state('No action selected');

  const toaster = createToaster({ duration: 6000 });

  // Dark mode is nothing but a `data-theme` attribute plus semantic overrides in app.css.
  $effect(() => {
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
    else document.documentElement.removeAttribute('data-theme');
  });

  const emailError = $derived(
    brokenEmail.includes('@') && brokenEmail.split('@')[1]
      ? undefined
      : 'Enter a complete address, e.g. name@studio.com'
  );

  const formatOptions = [
    { value: 'svg', label: 'SVG vector' },
    { value: 'pdf', label: 'PDF document' },
    { value: 'png', label: 'PNG image' },
  ] as const;
  const modeOptions = [
    { value: 'design', label: 'Design' },
    { value: 'proof', label: 'Proof' },
    { value: 'batch', label: 'Batch' },
  ];
  const menuItems = [
    { value: 'new', label: 'New document', hint: '⌘N' },
    { value: 'duplicate', label: 'Duplicate' },
    { value: 'archive', label: 'Archive', separatorBefore: true },
  ];
  const tabItems = [
    { value: 'overview', label: 'Overview' },
    { value: 'tokens', label: 'Tokens' },
    { value: 'usage', label: 'Usage' },
  ];
  const primitiveSwatches = [
    ['Paper', colors.paper, colors.deep],
    ['Panel', colors.panel, colors.deep],
    ['Deep', colors.deep, colors.panel],
    ['Muted', colors.muted, colors.white],
    ['Line', colors.line, colors.deep],
    ['Orange', colors.orange, colors.white],
    ['Success', colors.success, colors.white],
    ['Error', colors.error, colors.white],
  ] as const;
  const semanticRoles = [
    ['surface', semantic.surface],
    ['surface-alt', semantic.surfaceAlt],
    ['text', semantic.text],
    ['text-muted', semantic.textMuted],
    ['border', semantic.border],
    ['accent', semantic.accent],
  ] as const;

  const tabUsage = "npm install @loidolt/theme-svelte\n@import '@loidolt/theme-svelte/styles.css';";
  const installUsage = `npm install @loidolt/theme-svelte

/* app.css */
@import '@loidolt/theme-svelte/styles.css';

/* Component */
import { Button, Field, Input } from '@loidolt/theme-svelte';`;
  const themingUsage = `/* Restyle the whole system by redefining the semantic tier only. */
[data-theme='dark'] {
  --loidolt-surface: #1e211c;
  --loidolt-text: #ebe7dc;
  --loidolt-border: #3a3d34;
  --loidolt-accent: #e0672f;
  --loidolt-on-accent: #161814;
}`;
</script>

<svelte:head><title>Loidolt Theme — Svelte design system</title></svelte:head>
<a class="ldt-skip-link" href="#catalog-content">Skip to catalog</a>
<TooltipProvider>
  <AppShell class="catalog-shell" mainId="catalog-content">
    {#snippet header()}
      <div class="catalog-nav">
        <Topbar navLabel="Catalog sections">
          {#snippet brand()}<Brand name="Loidolt" meta={`Theme ${version}`} href="#top" />{/snippet}
          {#snippet navigation()}<a class="catalog-nav-link" href="#foundations">Foundations</a><a
              class="catalog-nav-link"
              href="#controls">Controls</a
            ><a class="catalog-nav-link" href="#surfaces">Surfaces</a><a
              class="catalog-nav-link"
              href="#overlays">Overlays</a
            ><a class="catalog-nav-link" href="#layouts">Layouts</a>{/snippet}
          {#snippet actions()}<Badge variant="accent">Svelte 5</Badge><Switch
              bind:checked={dark}
              name="theme"
              value="dark">Dark</Switch
            >{/snippet}
        </Topbar>
        <ContextBar
          section="Catalog"
          title="Shared application language"
          detail="Topostack × Label Studio"
        />
      </div>
    {/snippet}

    <div class="catalog-main">
      <section class="catalog-hero" id="top">
        <div>
          <p class="ldt-eyebrow">Loidolt design system</p>
          <h1>Useful tools, <span>quietly exact.</span></h1>
          <p class="catalog-hero__copy">
            A Svelte-first component library for dense creative tools and clean everyday
            applications. Warm surfaces, sharp edges, clear hierarchy, and no Tailwind contract.
          </p>
          <div class="ldt-cluster">
            <Button variant="primary" href="#controls">Explore components</Button><Button
              href="#layouts"
              variant="quiet">See the shell</Button
            >
          </div>
        </div>
        <div class="catalog-hero__meta" aria-label="Library facts">
          <div class="catalog-stat"><strong>{componentCount}</strong><span>Components</span></div>
          <div class="catalog-stat"><strong>3</strong><span>Packages</span></div>
          <div class="catalog-stat"><strong>0</strong><span>React exports</span></div>
          <div class="catalog-stat"><strong>AA</strong><span>Target</span></div>
        </div>
      </section>

      <section class="catalog-section" id="foundations">
        <div class="catalog-section__head">
          <p class="ldt-eyebrow">01 / Foundations</p>
          <div>
            <h2>Warm, technical, restrained.</h2>
            <p>
              Primitives hold the palette; a semantic tier names the roles components actually use.
              Every swatch below is read from <code>@loidolt/theme-tokens</code>, not copied.
            </p>
          </div>
        </div>
        <div class="catalog-grid">
          {#each primitiveSwatches as [name, value, ink] (name)}<div
              class="catalog-swatch"
              style:background={value}
              style:color={ink}
            >
              <strong>{name}</strong><span>{value}</span>
            </div>{/each}
        </div>
        <div class="catalog-demo" style="margin-top:1rem">
          <span class="catalog-demo-label">Theming — semantic roles only</span>
          <p class="catalog-hero__copy">
            The two panels render the same components. The right one only redefines semantic custom
            properties on its wrapper; no component class or prop changes.
          </p>
          <div class="catalog-theme-pair">
            <div class="catalog-theme-panel">
              <span class="catalog-demo-label">Default</span>
              <div class="ldt-cluster">
                <Button variant="primary">Export</Button><Button variant="quiet">Cancel</Button
                ><Badge variant="accent" size="md">Live</Badge>
              </div>
              <div class="catalog-roles">
                {#each semanticRoles as [role, value] (role)}<div class="catalog-role">
                    <span class="catalog-role__chip" style:background={`var(--loidolt-${role})`}
                    ></span><strong>{role}</strong><span class="catalog-role__value">{value}</span>
                  </div>{/each}
              </div>
            </div>
            <div class="catalog-theme-panel catalog-theme-override ldt-theme">
              <span class="catalog-demo-label">Overridden</span>
              <div class="ldt-cluster">
                <Button variant="primary">Export</Button><Button variant="quiet">Cancel</Button
                ><Badge variant="accent" size="md">Live</Badge>
              </div>
              <div class="catalog-roles">
                {#each semanticRoles as [role] (role)}<div class="catalog-role">
                    <span class="catalog-role__chip" style:background={`var(--loidolt-${role})`}
                    ></span><strong>{role}</strong><span class="catalog-role__value"
                      >overridden</span
                    >
                  </div>{/each}
              </div>
            </div>
          </div>
          <pre style="margin-top:1rem">{themingUsage}</pre>
        </div>
      </section>

      <section class="catalog-section" id="controls">
        <div class="catalog-section__head">
          <p class="ldt-eyebrow">02 / Controls</p>
          <div>
            <h2>Compact without feeling cramped.</h2>
            <p>
              Actions and fields share predictable sizing, explicit focus states, and native form
              behavior.
            </p>
          </div>
        </div>
        <div class="ldt-stack" style="--ldt-gap: 1rem">
          <div class="catalog-demo">
            <span class="catalog-demo-label">Buttons</span>
            <div class="ldt-cluster">
              <Button variant="primary">Primary action</Button><Button>Default</Button><Button
                variant="quiet">Quiet</Button
              ><Button variant="danger">Destructive</Button><Button variant="ghost">Ghost</Button
              ><Button variant="text">Text action</Button><Button loading loadingText="Building"
                >Build</Button
              ><IconButton label="Add item">＋</IconButton><Tooltip content="Precise settings"
                >{#snippet trigger()}⚙{/snippet}</Tooltip
              >
            </div>
          </div>
          <div class="catalog-demo">
            <span class="catalog-demo-label">Fields</span>
            <div class="catalog-grid">
              <Field label="Contact email" description="Used only for delivery updates."
                >{#snippet children({ id, describedBy, invalid })}<Input
                    {id}
                    type="email"
                    bind:value={email}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    boxed
                  />{/snippet}</Field
              ><Field label="Delivery email" error={emailError}
                >{#snippet children({ id, describedBy, invalid })}<Input
                    {id}
                    type="email"
                    bind:value={brokenEmail}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    boxed
                  />{/snippet}</Field
              ><Field label="Export format"
                >{#snippet children({ id, describedBy, invalid })}<Select
                    {id}
                    bind:value={format}
                    options={[...formatOptions]}
                    placeholder="Choose a format"
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    boxed
                  />{/snippet}</Field
              ><Field label="Layer count"
                >{#snippet children({ id })}<NumberField
                    {id}
                    bind:value={layers}
                    min={1}
                    max={40}
                    label="Layer count"
                    boxed
                  />{/snippet}</Field
              ><Field label="Project note" optional
                >{#snippet children({ id, describedBy, invalid })}<Textarea
                    {id}
                    bind:value={notes}
                    aria-describedby={describedBy}
                    aria-invalid={invalid}
                    boxed
                  />{/snippet}</Field
              >
            </div>
          </div>
          <div class="catalog-demo">
            <span class="catalog-demo-label">Choice controls</span>
            <div class="ldt-cluster">
              <Checkbox bind:checked={guides}>Alignment guides</Checkbox><Switch
                bind:checked={enabled}>Live preview</Switch
              ><RadioGroup bind:value={mode} options={modeOptions} label="Workspace mode" />
            </div>
          </div>
          <div class="catalog-demo">
            <span class="catalog-demo-label">Standalone label</span>
            <div class="ldt-stack" style="--ldt-gap: 0.35rem">
              <Label for="catalog-standalone-input">Sheet name</Label>
              <Input id="catalog-standalone-input" boxed value="Crater Lake — sheet 1" />
            </div>
          </div>
        </div>
      </section>

      <section class="catalog-section" id="surfaces">
        <div class="catalog-section__head">
          <p class="ldt-eyebrow">03 / Surfaces</p>
          <div>
            <h2>Structure without decoration.</h2>
            <p>
              Borders and spacing carry hierarchy. Shadows appear only where elevation communicates
              behavior.
            </p>
          </div>
        </div>
        <div class="catalog-grid">
          <Card title="Terrain project" description="Crater Lake, Oregon"
            >A composed card for general application content.{#snippet footer()}<div
                class="ldt-cluster"
              >
                <Badge variant="success">Ready</Badge><Button variant="text">Open</Button>
              </div>{/snippet}</Card
          ><Panel title="Fabrication status"
            ><div class="ldt-stack">
              <div class="ldt-cluster">
                <Spinner label="Generating preview" /> Generating preview
              </div>
              <Progress value={72} label="Generation progress" /><Progress
                label="Uploading"
              /><Skeleton height="1.2rem" />
            </div></Panel
          >
        </div>
        <div class="catalog-grid" style="margin-top:1rem">
          <Alert title="Import complete" variant="info">Nothing needs your attention.</Alert><Alert
            title="Preview ready"
            variant="success">All geometry checks passed.</Alert
          ><Alert title="Material warning" variant="warning"
            >Two layers exceed the selected sheet width.</Alert
          ><Alert title="Export blocked" variant="error"
            >Resolve document errors before export.</Alert
          >
        </div>
        <div class="catalog-demo" style="margin-top:1rem">
          <span class="catalog-demo-label">Table</span><Table caption="Recent projects"
            ><thead><tr><th>Project</th><th>Format</th><th>Status</th></tr></thead><tbody
              ><tr
                ><td>Crater Lake</td><td>SVG</td><td><Badge variant="success">Ready</Badge></td></tr
              ><tr
                ><td>Grand Teton</td><td>PDF</td><td><Badge variant="warning">Review</Badge></td
                ></tr
              ><tr><td>Rainier</td><td>SVG</td><td><Badge>Draft</Badge></td></tr></tbody
            ></Table
          >
        </div>
      </section>

      <section class="catalog-section" id="overlays">
        <div class="catalog-section__head">
          <p class="ldt-eyebrow">04 / Overlays</p>
          <div>
            <h2>Accessible interaction primitives.</h2>
            <p>
              Focus handling, portals, dismissal, and keyboard navigation are delegated to Bits UI
              while presentation stays Loidolt-owned.
            </p>
          </div>
        </div>
        <div class="catalog-demo">
          <div class="ldt-cluster">
            <Dialog
              title="Export fabrication package"
              description="Choose a final format and verify the current project."
              size="md"
              >{#snippet trigger()}Open dialog{/snippet}
              <p>
                Your project contains {layers} layers and will export as {(
                  format || 'no format'
                ).toUpperCase()}.
              </p>
              {#snippet footer()}<Button variant="quiet">Cancel</Button><Button
                  variant="primary"
                  onclick={() =>
                    toaster.push({
                      title: 'Export queued',
                      description: 'Your fabrication package is being prepared.',
                      variant: 'success',
                    })}>Export</Button
                >{/snippet}</Dialog
            >
            <Popover
              >{#snippet trigger()}Project details{/snippet}
              <div class="ldt-stack">
                <strong>Crater Lake</strong><span class="ldt-utility-text"
                  >42.9446° N · 122.1090° W</span
                ><Separator /><span>{layers} fabrication layers</span>
              </div></Popover
            >
            <DropdownMenu
              groupLabel="Document"
              items={menuItems}
              onSelect={(value) => (selectedMenu = value)}
              >{#snippet trigger()}File{/snippet}</DropdownMenu
            ><Badge size="md">{selectedMenu}</Badge>
            <NavMenu
              label="Libraries"
              groupLabel="Reusable resources"
              active
              items={[
                { value: 'templates', label: 'Templates' },
                { value: 'primitives', label: 'Primitives' },
                { value: 'cutouts', label: 'Cutouts' },
              ]}
              onSelect={(value) => (selectedMenu = value)}
            />
            <Button
              variant="quiet"
              onclick={() => toaster.push({ title: 'Saved', description: 'Draft stored locally.' })}
              >Raise a toast</Button
            >
          </div>
        </div>
        <div class="catalog-demo" style="margin-top:1rem">
          <Tabs tabs={tabItems} label="Catalog detail"
            >{#snippet children({ value })}{#if value === 'overview'}A small, coherent foundation
                for Loidolt applications.{:else if value === 'tokens'}Typed values and CSS
                properties stay in sync.{:else}<pre>{tabUsage}</pre>{/if}{/snippet}</Tabs
          >
        </div>
      </section>

      <section class="catalog-section" id="layouts">
        <div class="catalog-section__head">
          <p class="ldt-eyebrow">05 / Layouts</p>
          <div>
            <h2>The editor shell, extracted.</h2>
            <p>
              Top bars, context, sidebars, and the workspace remain modular so apps can compose two-
              or three-column tools without importing domain behavior.
            </p>
          </div>
        </div>
        <div class="catalog-editor">
          <div>
            <Topbar navLabel="Editor"
              >{#snippet brand()}<Brand
                  name="Topo Studio"
                  meta="Project 04"
                />{/snippet}{#snippet navigation()}<Button variant="ghost" size="sm">Design</Button
                ><Button variant="ghost" size="sm">Layers</Button
                >{/snippet}{#snippet actions()}<Button variant="primary" size="sm">Export</Button
                >{/snippet}</Topbar
            ><ContextBar section="Terrain" title="Crater Lake" detail="Real-data preview ready" />
          </div>
          <Workspace
            >{#snippet sidebar()}<Sidebar label="Configuration"
                ><p class="ldt-eyebrow">Configuration</p>
                <h3>Terrain model</h3>
                <div class="ldt-stack">
                  <Field label="Layers"
                    >{#snippet children({ id })}<NumberField
                        {id}
                        bind:value={layers}
                        min={1}
                        max={40}
                        label="Layers"
                      />{/snippet}</Field
                  ><Switch bind:checked={guides}>Contour guides</Switch><Select
                    label="Export format"
                    bind:value={format}
                    options={[...formatOptions]}
                    boxed
                  />
                </div></Sidebar
              >{/snippet}
            <div class="catalog-canvas">
              <div class="catalog-artboard">
                <div>
                  <span class="ldt-eyebrow">Preview</span><strong>Crater Lake</strong>
                  <p>{layers} layers · {(format || 'no format').toUpperCase()}</p>
                  <Badge variant={enabled ? 'success' : 'warning'}
                    >{enabled ? 'Live' : 'Paused'}</Badge
                  >
                </div>
              </div>
            </div></Workspace
          >
        </div>
        <p class="catalog-hero__copy" style="margin-top:1rem">
          Without a <code>sidebar</code> snippet the same component collapses to a single full-width column:
        </p>
        <div class="catalog-editor" style="min-height:14rem">
          <div><ContextBar section="Terrain" title="Full-width canvas" /></div>
          <Workspace><div class="catalog-canvas" style="min-height:10rem"></div></Workspace>
        </div>
        <Section eyebrow="General page" title="The same system works outside editors."
          >{#snippet actions()}<Button variant="primary">Create project</Button
            >{/snippet}<PageHeader
            eyebrow="Projects"
            title="Your recent work"
            headingLevel={3}
            description="A general application header and content region using the same foundation."
          />
          <div class="catalog-grid">
            <Card title="Crater Lake" headingLevel={4}>Updated today</Card><Card
              title="Grand Teton"
              headingLevel={4}>Updated yesterday</Card
            ><Card title="Rainier" headingLevel={4}>Updated last week</Card>
          </div></Section
        >
      </section>

      <section class="catalog-section">
        <div class="catalog-section__head">
          <p class="ldt-eyebrow">Install</p>
          <div>
            <h2>One CSS import. Svelte components on demand.</h2>
            <p>
              Tokens and styles can also be consumed independently when a project needs only the
              visual foundation.
            </p>
          </div>
        </div>
        <pre>{installUsage}</pre>
      </section>
    </div>

    {#snippet footer()}<div class="catalog-footer">
        Loidolt Theme · Svelte 5 · Jost + Archivo · Light and dark
      </div>{/snippet}
  </AppShell>
</TooltipProvider>

<ToastViewport onpointerenter={toaster.pause} onpointerleave={toaster.resume}>
  {#each toaster.toasts as toast (toast.id)}
    <Toast
      title={toast.title}
      description={toast.description}
      variant={toast.variant}
      onDismiss={() => toaster.dismiss(toast.id)}
    />
  {/each}
</ToastViewport>
