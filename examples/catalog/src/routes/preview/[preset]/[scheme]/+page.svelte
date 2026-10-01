<script lang="ts">
  import { Section } from '@loidolt/theme-svelte';
  import Alert from '$lib/demos/Alert.svelte';
  import Badge from '$lib/demos/Badge.svelte';
  import Breadcrumbs from '$lib/demos/Breadcrumbs.svelte';
  import Button from '$lib/demos/Button.svelte';
  import Card from '$lib/demos/Card.svelte';
  import Checkbox from '$lib/demos/Checkbox.svelte';
  import Field from '$lib/demos/Field.svelte';
  import Pagination from '$lib/demos/Pagination.svelte';
  import Progress from '$lib/demos/Progress.svelte';
  import RadioGroup from '$lib/demos/RadioGroup.svelte';
  import Select from '$lib/demos/Select.svelte';
  import Stat from '$lib/demos/Stat.svelte';
  import Switch from '$lib/demos/Switch.svelte';
  import Table from '$lib/demos/Table.svelte';
  import Tabs from '$lib/demos/Tabs.svelte';
  import ToggleGroup from '$lib/demos/ToggleGroup.svelte';

  let { data } = $props();

  /*
   * The component pages' own demos, so the sampler can never drift from what the catalog
   * documents. Chosen to exercise every role group: corners, strokes, density and voice.
   */
  const samples = [
    ['Actions', Button],
    ['Toggle group', ToggleGroup],
    ['Field', Field],
    ['Select', Select],
    ['Checkbox', Checkbox],
    ['Radio group', RadioGroup],
    ['Switch', Switch],
    ['Tabs', Tabs],
    ['Badges', Badge],
    ['Alerts', Alert],
    ['Card', Card],
    ['Stat', Stat],
    ['Table', Table],
    ['Progress', Progress],
    ['Breadcrumbs', Breadcrumbs],
    ['Pagination', Pagination],
  ] as const;
</script>

<svelte:head><title>{data.label} preset, {data.scheme} — Loidolt Theme</title></svelte:head>

<main class="docs-preview">
  <header class="docs-preview__header">
    <p class="ldt-eyebrow">Preset preview · {data.scheme}</p>
    <h1>{data.label}</h1>
    {#if data.description}<p class="ldt-muted">{data.description}</p>{/if}
  </header>
  {#each samples as [title, Sample] (title)}
    <Section {title} headingLevel={2}><Sample /></Section>
  {/each}
</main>
