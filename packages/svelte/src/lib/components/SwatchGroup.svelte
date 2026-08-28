<script lang="ts" generics="T extends string = string">
  import type { HTMLFieldsetAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface SwatchOption<V extends string = string> {
    value: V;
    /** Accessible name of the swatch. Falls back to the color value. */
    label?: string;
    /** Any CSS color. */
    color: string;
    disabled?: boolean;
  }

  interface Props extends HTMLFieldsetAttributes {
    options: SwatchOption<T>[];
    value?: T;
    onValueChange?: (value: T) => void;
    size?: 'sm' | 'md';
    /** Visible group label, rendered as a `<legend>`. */
    label?: string;
    /** Shared `name` for the radios. Defaults to an SSR-stable generated id. */
    name?: string;
    disabled?: boolean;
    class?: string;
    ref?: HTMLFieldSetElement | null;
  }

  const generatedName = $props.id();

  let {
    options,
    value = $bindable(),
    onValueChange,
    size = 'md',
    label,
    name = generatedName,
    disabled = false,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<fieldset bind:this={ref} class={cx('ldt-fieldset', className)} {disabled} {...rest}>
  {#if label}<legend class="ldt-legend">{label}</legend>{/if}
  <div class={cx('ldt-swatch-group', size === 'sm' && 'ldt-swatch-group--sm')}>
    {#each options as option (option.value)}
      <label
        class="ldt-swatch-group__swatch"
        style={`--ldt-swatch: ${option.color};`}
        title={option.label ?? option.color}
      >
        <input
          class="ldt-sr-only"
          type="radio"
          {name}
          value={option.value}
          checked={value === option.value}
          disabled={option.disabled}
          onchange={() => {
            value = option.value;
            onValueChange?.(option.value);
          }}
        />
        <span class="ldt-sr-only">{option.label ?? option.color}</span>
      </label>
    {/each}
  </div>
</fieldset>
