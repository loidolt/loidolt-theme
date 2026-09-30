<script lang="ts">
  import { autofocus } from '../attachments.js';

  /*
   * A cell that turns into a text field on demand. Enter or leaving the field saves; Escape puts
   * the old value back. The resting state is a real button, so the cell is reachable and
   * announced as editable without making the whole row a click target.
   */
  interface Props {
    value: string;
    label: string;
    onCommit: (value: string) => void;
  }

  let { value, label, onCommit }: Props = $props();

  let editing = $state(false);
  let draft = $state('');
  let button = $state<HTMLButtonElement | null>(null);

  function start() {
    draft = value;
    editing = true;
  }

  function finish(save: boolean) {
    if (!editing) return;
    editing = false;
    if (save && draft !== value) onCommit(draft);
    // Hand focus back to the cell once it is a button again.
    queueMicrotask(() => button?.focus());
  }
</script>

{#if editing}
  <input
    class="ldt-data-table__edit-input"
    aria-label={label}
    bind:value={draft}
    {@attach autofocus({ select: true, delay: 0 })}
    onkeydown={(event) => {
      if (event.key === 'Enter') finish(true);
      else if (event.key === 'Escape') {
        event.stopPropagation();
        finish(false);
      }
    }}
    onblur={() => finish(true)}
  />
{:else}
  <button
    bind:this={button}
    type="button"
    class="ldt-data-table__edit"
    aria-label={`${label}: ${value}`}
    onclick={start}>{value}</button
  >
{/if}
