<script lang="ts" module>
  export const TOOLTIP_PROVIDER_KEY = Symbol('ldt-tooltip-provider');
</script>

<script lang="ts">
  import { Tooltip as TooltipPrimitive } from 'bits-ui';
  import { setContext, type Snippet } from 'svelte';

  interface Props {
    /** Delay before the first tooltip in the group opens. */
    delayDuration?: number;
    /** Window after closing one tooltip in which the next opens instantly. */
    skipDelayDuration?: number;
    disableHoverableContent?: boolean;
    disabled?: boolean;
    children: Snippet;
  }

  let {
    delayDuration = 350,
    skipDelayDuration = 300,
    disableHoverableContent = false,
    disabled = false,
    children,
  }: Props = $props();

  // Tooltips inside this subtree skip their own Provider, so skip-delay grouping works.
  setContext(TOOLTIP_PROVIDER_KEY, true);
</script>

<TooltipPrimitive.Provider {delayDuration} {skipDelayDuration} {disableHoverableContent} {disabled}
  >{@render children()}</TooltipPrimitive.Provider
>
