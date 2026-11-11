<script lang="ts">
  import type { Snippet } from 'svelte';
  import RichText from './RichText.svelte';

  interface Props {
    /** What the example shows, with `backticks` around code so it keeps its case. Omit for the
     * single unlabelled example on a component page. */
    label?: string;
    children: Snippet;
  }

  let { label, children }: Props = $props();
</script>

<div class="docs-demo">
  {#if label}<span class="docs-demo__label"><RichText value={label} /></span>{/if}
  <div class="docs-demo__body">{@render children()}</div>
</div>
