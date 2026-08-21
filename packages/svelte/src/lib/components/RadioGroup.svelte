<script lang="ts" generics="T extends string = string">
  import type { HTMLFieldsetAttributes } from 'svelte/elements';
  import type { Option, Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLFieldsetAttributes {
    value?: T;
    options: Option<T>[];
    /** Shared `name` for the inputs. Defaults to an SSR-stable generated id. */
    name?: string;
    /** Visible group label, rendered as a `<legend>`. */
    label?: string;
    orientation?: Orientation;
    onValueChange?: (value: T) => void;
    class?: string;
    ref?: HTMLFieldSetElement | null;
  }

  // `$props.id()` matches between SSR and hydration; `Math.random()` split radio groups in two.
  const generatedName = $props.id();

  let {
    value = $bindable(),
    options,
    name = generatedName,
    label,
    orientation = 'horizontal',
    onValueChange,
    class: className,
    ref = $bindable(null),
    ...rest
  }: Props = $props();
</script>

<fieldset bind:this={ref} class={cx('ldt-fieldset', className)} {...rest}>
  {#if label}<legend class="ldt-legend">{label}</legend>{/if}
  <div class={cx('ldt-radio-group', orientation === 'vertical' && 'ldt-radio-group--vertical')}>
    {#each options as option (option.value)}<label class="ldt-choice"
        ><input
          type="radio"
          {name}
          value={option.value}
          bind:group={value}
          disabled={option.disabled}
          onchange={() => onValueChange?.(option.value)}
        />{option.label}</label
      >{/each}
  </div>
</fieldset>
