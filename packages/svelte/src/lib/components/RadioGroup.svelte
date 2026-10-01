<script lang="ts" generics="T extends string = string">
  import type { HTMLFieldsetAttributes } from 'svelte/elements';
  import type { ChoiceOption, Orientation } from '../types.js';
  import { cx } from '../utils.js';

  interface Props extends HTMLFieldsetAttributes {
    value?: T;
    /** Choices. A `description` renders under its label and is read after it. */
    options: ChoiceOption<T>[];
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
    {#each options as option, index (option.value)}
      {@const labelId = `${generatedName}-${index}-label`}
      {@const descriptionId = option.description
        ? `${generatedName}-${index}-description`
        : undefined}
      <label class={cx('ldt-choice', option.description && 'ldt-choice--described')}
        ><input
          type="radio"
          {name}
          value={option.value}
          bind:group={value}
          disabled={option.disabled}
          aria-labelledby={option.description ? labelId : undefined}
          aria-describedby={descriptionId}
          onchange={() => onValueChange?.(option.value)}
        /><span class="ldt-choice__text"
          ><span id={labelId}>{option.label}</span>{#if option.description}<span
              class="ldt-choice__description"
              id={descriptionId}>{option.description}</span
            >{/if}</span
        ></label
      >
    {/each}
  </div>
</fieldset>
