<script lang="ts">
  interface Props {
    /** Plain text where `backticks` mark inline code. */
    value: string;
  }

  let { value }: Props = $props();

  /*
   * The registry notes are plain strings, not markdown — a full parser would be a dependency and
   * an XSS surface for the sake of one construct. Splitting on backticks covers the only piece of
   * formatting the notes actually use, and leaves everything else as text.
   */
  const parts = $derived(
    value.split('`').map((text, index) => ({ text, code: index % 2 === 1, key: index }))
  );
</script>

{#each parts as part (part.key)}{#if part.code}<code>{part.text}</code
    >{:else}{part.text}{/if}{/each}
