<script lang="ts">
  import { ToggleGroup, cx } from '@loidolt/theme-svelte';
  import type { StyleSpecification } from '../core/types.js';
  import { requireMapContext } from '../internal/context.js';
  import MapControl from './MapControl.svelte';

  type Corner = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

  interface Basemap {
    id: string;
    label: string;
    /** A style of your own. Leave it out for the built-in `default` and `blank`. */
    style?: string | StyleSpecification;
  }

  interface Props {
    /** The choices, in order. Defaults to the loidolt basemap and the plain one. */
    basemaps?: Basemap[];
    /** Names the group of choices. */
    label?: string;
    position?: Corner;
    onChange?: (id: string) => void;
    class?: string;
  }

  let {
    basemaps = [
      { id: 'default', label: 'Map' },
      { id: 'blank', label: 'Plain' },
    ],
    label = 'Basemap',
    position = 'top-left',
    onChange,
    class: className,
  }: Props = $props();

  const context = requireMapContext('BasemapSwitcher');
</script>

<MapControl {position} class={cx('ldt-basemap-switcher', className)}>
  <ToggleGroup
    {label}
    size="sm"
    value={context.basemap}
    options={basemaps.map((basemap) => ({ value: basemap.id, label: basemap.label }))}
    onValueChange={(next) => {
      const choice = basemaps.find((basemap) => basemap.id === next);
      if (!choice) return;
      context.setBasemap(choice.id, choice.style);
      onChange?.(choice.id);
    }}
  />
</MapControl>
