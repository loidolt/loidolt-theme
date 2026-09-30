<script lang="ts">
  import type { Component } from 'svelte';
  import { mapColors } from '@loidolt/theme-tokens';
  import { setMapContext } from '../../src/lib/internal/context.js';

  /** Renders a map child with a map context but no map — as the server sees it. */
  let {
    component: Child,
    props = {},
  }: { component: Component<any>; props?: Record<string, unknown> } = $props();

  setMapContext({
    map: null,
    lib: null,
    loaded: false,
    styleVersion: 0,
    colors: mapColors(),
    colorVersion: 0,
    reducedMotion: false,
    basemap: 'default',
    setBasemap: () => {},
    layers: [],
    registerLayer: () => () => {},
  });
</script>

<Child {...props} />
