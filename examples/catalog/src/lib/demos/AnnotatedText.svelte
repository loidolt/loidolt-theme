<script lang="ts">
  import { AnnotatedText, Badge, Field, type TextMark } from '@loidolt/theme-svelte';

  const text =
    'The workshop cuts two sheets of birch ply each morning. Off-cuts go into the bin by the door, and the dust extractor runs until the last sheet is sanded.';
  /** Marks a word by its first occurrence, so the sample stays right if the copy changes. */
  const at = (word: string, mark: Omit<TextMark, 'start' | 'end'>): TextMark => {
    const start = text.indexOf(word);
    return { ...mark, start, end: start + word.length };
  };

  let value = $state(text);
  let marks = $state<TextMark[]>([
    at('birch', { id: 'birch', variant: 'warning', label: 'Low confidence' }),
    at('Off-cuts', { id: 'offcuts', variant: 'info', label: 'Rejoined hyphen' }),
    at('door', { id: 'door', variant: 'error', label: 'Unreadable, guessed' }),
    at('sanded', { id: 'sanded', variant: 'success', label: 'Spelling corrected' }),
  ]);
  let current = $state<TextMark | null>(null);
</script>

<div class="ldt-stack">
  <Field label="Page text" description="F8 and Shift+F8 jump between marks.">
    {#snippet children({ id, describedBy })}
      <AnnotatedText
        {id}
        aria-describedby={describedBy}
        rows={5}
        bind:value
        bind:marks
        onMarkChange={(mark) => (current = mark)}
      />
    {/snippet}
  </Field>
  <p class="ldt-utility-text">
    {current ? `Caret in “${value.slice(current.start, current.end)}”` : 'Caret outside the marks'}
  </p>
  <ul class="ldt-stack" aria-label="Remaining marks">
    {#each marks as mark (mark.id)}
      <li>
        <Badge variant={mark.variant}>{mark.label}</Badge>
        “{value.slice(mark.start, mark.end)}” at {mark.start}–{mark.end}
      </li>
    {:else}
      <li>No marks left.</li>
    {/each}
  </ul>
</div>
