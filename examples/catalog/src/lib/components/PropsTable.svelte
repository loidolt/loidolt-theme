<script lang="ts">
  import { Badge, EmptyState, Table, TableHeader } from '@loidolt/theme-svelte';
  import { propDocs } from '$lib/props.js';
  import RichText from './RichText.svelte';

  interface Props {
    /** Component name, as exported and as keyed in the generated prop data. */
    name: string;
  }

  let { name }: Props = $props();

  const entry = $derived(propDocs[name] ?? { bases: [], props: [] });

  /**
   * `id = generatedId` in the source means `$props.id()` — a generated, SSR-stable value. Showing
   * the local variable name would send a reader looking for something that is not part of the API.
   */
  const shown = (value: string | undefined) =>
    value === undefined ? '—' : /^generated[A-Z]/.test(value) ? '$props.id()' : value;
</script>

{#if entry.props.length === 0}
  <EmptyState
    title="No documented props"
    description="This component takes only the attributes of the element it renders."
    headingLevel={3}
  />
{:else}
  <Table caption={`${name} props`} regionLabel={`${name} props`}>
    <thead>
      <tr>
        <TableHeader>Prop</TableHeader>
        <TableHeader>Type</TableHeader>
        <TableHeader>Default</TableHeader>
        <TableHeader>Notes</TableHeader>
      </tr>
    </thead>
    <tbody>
      {#each entry.props as prop (prop.name)}
        <tr>
          <td>
            <code>{prop.name}</code>
            {#if prop.required}<Badge variant="accent">required</Badge>{/if}
            {#if prop.bindable}<Badge variant="info">bindable</Badge>{/if}
          </td>
          <td><code class="docs-type">{prop.type}</code></td>
          <td><code>{shown(prop.default)}</code></td>
          <td
            >{#if prop.doc}<RichText value={prop.doc} />{/if}</td
          >
        </tr>
      {/each}
    </tbody>
  </Table>
{/if}

{#if entry.bases.length > 0}
  <p class="docs-note">
    Plus the attributes of
    {#each entry.bases as base, index (base)}<code>{base}</code>{#if index < entry.bases.length - 1}
        and
      {/if}{/each}, forwarded to the root element.
  </p>
{/if}
