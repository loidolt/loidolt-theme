<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLFieldsetAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends HTMLFieldsetAttributes {
    /** Defaults to an SSR-stable generated id, used to wire the description and error. */
    id?: string;
    /** Visible group label, rendered as a `<legend>`. */
    legend: string;
    description?: string;
    error?: string;
    optional?: boolean;
    /** Text of the "optional" marker, for localisation. */
    optionalText?: string;
    class?: string;
    children: Snippet;
    ref?: HTMLFieldSetElement | null;
  }

  const generatedId = $props.id();

  let {
    id = generatedId,
    legend,
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

<!--
  `Field` wires one control; `Fieldset` wires a group of them. The description and error hang off
  the `<fieldset>` rather than off each control: grouping context is announced once on entry, so
  a shared message stays shared instead of repeating on every checkbox in the set.
-->
<fieldset
  bind:this={ref}
  {id}
  class={cx('ldt-fieldset', className)}
  aria-describedby={describedBy}
  {...rest}
>
  <legend class="ldt-legend"
    ><span>{legend}</span>{#if optional}<small>{optionalText}</small>{/if}</legend
  >
  <div class="ldt-fieldset__body">{@render children()}</div>
  {#if description}<p class="ldt-field__description" id={`${id}-description`}>{description}</p>{/if}
  {#if error}<p class="ldt-field__error" id={`${id}-error`} role="alert">{error}</p>{/if}
</fieldset>
