<script lang="ts">
  import type { TextMark } from '../../src/lib/annotated-text.js';
  import AnnotatedText from '../../src/lib/components/AnnotatedText.svelte';
  import Field from '../../src/lib/components/Field.svelte';

  let {
    value = $bindable('Two sheets of ply'),
    marks = $bindable<TextMark[]>([]),
    description,
    onMarkChange,
    controls = true,
  }: {
    value?: string;
    marks?: TextMark[];
    description?: string;
    onMarkChange?: (mark: TextMark | null) => void;
    controls?: boolean;
  } = $props();

  let editor = $state<ReturnType<typeof AnnotatedText>>();
</script>

<Field label="Page text" {description}>
  {#snippet children({ id, describedBy })}
    <AnnotatedText
      bind:this={editor}
      {id}
      aria-describedby={describedBy}
      bind:value
      bind:marks
      {onMarkChange}
      {controls}
    />
  {/snippet}
</Field>
<span data-testid="value">{value}</span>
<span data-testid="marks"
  >{JSON.stringify(marks.map((mark) => [mark.id, mark.start, mark.end]))}</span
>
<button type="button" onclick={() => editor?.focusMark('b')}>Focus b</button>
<button type="button" onclick={() => (value = 'Replaced')}>Replace text</button>
