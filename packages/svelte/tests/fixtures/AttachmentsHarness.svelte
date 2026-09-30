<script lang="ts">
  import {
    autofocus,
    clickOutside,
    escapeKey,
    focusTrap,
    rovingFocus,
    type FocusTrapOptions,
    type RovingFocusOptions,
  } from '../../src/lib/attachments.js';
  import LiveRegion from '../../src/lib/components/LiveRegion.svelte';
  import { createAnnouncer } from '../../src/lib/announcer.svelte.js';

  interface Props {
    onEscape?: () => void;
    escapeScope?: 'document' | 'node';
    escapeEnabled?: boolean;
    onOutside?: () => void;
    roving?: RovingFocusOptions;
    trap?: boolean;
    trapOptions?: FocusTrapOptions;
    focusOnMount?: boolean;
    focusDelay?: number;
  }

  let {
    onEscape = () => {},
    escapeScope = 'document',
    escapeEnabled = true,
    onOutside = () => {},
    roving = {},
    trap = false,
    trapOptions = {},
    focusOnMount = false,
    focusDelay,
  }: Props = $props();

  let ignored = $state<HTMLButtonElement | null>(null);
  const announcer = createAnnouncer({ clearAfter: 1000 });
</script>

<button type="button">Before</button>
<button type="button" bind:this={ignored}>Ignored</button>

<div
  data-testid="surface"
  {@attach escapeKey(onEscape, { enabled: escapeEnabled, scope: escapeScope })}
  {@attach clickOutside(onOutside, { ignore: [ignored] })}
>
  <input
    aria-label="Autofocused"
    {@attach autofocus({ enabled: focusOnMount, delay: focusDelay, select: true })}
    value="draft"
  />
  <button type="button">Inside</button>
</div>

<div role="toolbar" aria-label="Tools" {@attach rovingFocus(roving)}>
  <button type="button" data-roving-item>Cut</button>
  <button type="button" data-roving-item disabled>Copy</button>
  <button type="button" data-roving-item>Paste</button>
  <button type="button" data-roving-item>Undo</button>
</div>

{#if trap}
  <div data-testid="trap" {@attach focusTrap(trapOptions)}>
    <button type="button">First</button>
    <button type="button" hidden>Hidden</button>
    <button type="button">Last</button>
  </div>
{/if}

<button type="button" onclick={() => announcer.announce('Saved')}>Announce</button>
<button type="button" onclick={() => announcer.announce('Failed', { politeness: 'assertive' })}
  >Alert</button
>
<button type="button" onclick={announcer.clear}>Clear</button>
<LiveRegion message={announcer.message} politeness={announcer.politeness} />
<button type="button">After</button>
