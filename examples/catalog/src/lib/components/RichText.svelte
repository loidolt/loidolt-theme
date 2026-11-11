<script lang="ts">
  import { parseRichText } from '../rich-text.js';

  interface Props {
    /** Plain text where `backticks` mark inline code. */
    value: string;
  }

  let { value }: Props = $props();

  const parts = $derived(parseRichText(value));
</script>

{#each parts as part, index (index)}{#if part.code}<code>{part.text}</code
    >{:else}{part.text}{/if}{/each}
