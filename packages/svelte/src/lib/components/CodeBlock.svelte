<script lang="ts">
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    code: string;
    /** One click/tap selects the whole value. On by default — this block exists for copying. */
    selectable?: boolean;
    copyable?: boolean;
    copyLabel?: string;
    copiedLabel?: string;
    class?: string;
    ref?: HTMLDivElement | null;
  }

  let {
    code,
    selectable = true,
    copyable = false,
    copyLabel = 'Copy',
    copiedLabel = 'Copied',
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  let copied = $state(false);
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      copied = true;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => (copied = false), 2000);
    } catch {
      // Clipboard unavailable (permissions, insecure context) — the text stays selectable.
    }
  }
</script>

<div
  bind:this={ref}
  class={cx('ldt-code-block', selectable && 'ldt-code-block--selectable', className)}
  {...rest}
>
  <code class="ldt-code-block__code">{code}</code>
  {#if copyable}
    <button type="button" class="ldt-button ldt-button--quiet ldt-button--sm" onclick={copy}>
      {copied ? copiedLabel : copyLabel}
    </button>
    <!-- Persistently mounted so the announcement fires when the content changes. -->
    <span class="ldt-sr-only" role="status">{copied ? copiedLabel : ''}</span>
  {/if}
</div>
