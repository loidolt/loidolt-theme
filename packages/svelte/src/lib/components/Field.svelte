<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  // `children` is omitted from the base: this snippet takes the field's wiring as an argument.
  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
    /** Defaults to an SSR-stable generated id shared by the label and the control. */
    id?: string;
    /** Visible label text. */
    label: string;
    description?: string;
    error?: string;
    optional?: boolean;
    /** Text of the "optional" marker, for localisation. */
    optionalText?: string;
    class?: string;
    /** Receives the wiring the control needs: `id`, `aria-describedby`, and validity. */
    children: Snippet<[{ id: string; describedBy?: string; invalid: boolean }]>;
    ref?: HTMLDivElement | null;
  }

  // `$props.id()` is stable across SSR and hydration; `Math.random()` was not.
  const generatedId = $props.id();

  let {
    id = generatedId,
    label,
    description,
    error,
    optional = false,
    optionalText = 'Optional',
    class: className,
    children,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const describedBy = $derived(
    [description && `${id}-description`, error && `${id}-error`].filter(Boolean).join(' ') ||
      undefined
  );
</script>

<div bind:this={ref} class={cx('ldt-field', className)} {...rest}>
  <label class="ldt-field__label" for={id}
    ><span>{label}</span>{#if optional}<small>{optionalText}</small>{/if}</label
  >
  {@render children({ id, describedBy, invalid: Boolean(error) })}
  {#if description}<p class="ldt-field__description" id={`${id}-description`}>{description}</p>{/if}
  {#if error}<p class="ldt-field__error" id={`${id}-error`} role="alert">{error}</p>{/if}
</div>
