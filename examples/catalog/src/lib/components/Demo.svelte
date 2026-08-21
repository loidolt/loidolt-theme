<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    /** What the example shows. Omit for the single unlabelled example on a component page. */
    label?: string;
    children: Snippet;
  }

  let { label, children }: Props = $props();
</script>

<div class="docs-demo">
  {#if label}<span class="docs-demo__label">{label}</span>{/if}
  <div class="docs-demo__body">{@render children()}</div>
</div>
