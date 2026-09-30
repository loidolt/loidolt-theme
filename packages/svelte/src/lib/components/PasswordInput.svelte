<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  interface Props extends Omit<HTMLInputAttributes, 'value' | 'type'> {
    value?: string;
    /** Whether the password is shown as plain text. */
    visible?: boolean;
    onVisibleChange?: (visible: boolean) => void;
    /**
     * Accessible name of the reveal button. It stays the same in both states and `aria-pressed`
     * reports which one is active — changing the name as well would announce the state twice.
     */
    toggleLabel?: string;
    /** Custom button content; receives whether the password is visible. */
    toggle?: Snippet<[boolean]>;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    /** Lands on the wrapper; the rest props land on the input. */
    class?: string;
    inputClass?: string;
    ref?: HTMLInputElement | null;
  }

  const generatedId = $props.id();

  let {
    value = $bindable(''),
    visible = $bindable(false),
    onVisibleChange,
    toggleLabel = 'Show password',
    toggle,
    boxed = false,
    autocomplete = 'current-password',
    id = generatedId,
    disabled,
    class: className,
    inputClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  function flip() {
    visible = !visible;
    onVisibleChange?.(visible);
  }
</script>

<div
  class={cx('ldt-password-input', boxed && 'ldt-password-input--boxed', className)}
  data-disabled={disabled ? '' : undefined}
>
  <input
    bind:this={ref}
    bind:value
    {id}
    {disabled}
    {autocomplete}
    type={visible ? 'text' : 'password'}
    class={cx('ldt-password-input__input', inputClass)}
    autocapitalize="off"
    spellcheck="false"
    {...rest}
  />
  <button
    type="button"
    class="ldt-password-input__toggle"
    aria-label={toggleLabel}
    aria-pressed={visible}
    aria-controls={id}
    {disabled}
    onclick={flip}
  >
    {#if toggle}{@render toggle(visible)}{:else}
      <svg
        viewBox="0 0 20 20"
        width="18"
        height="18"
        aria-hidden="true"
        focusable="false"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        ><path d="M1.5 10S4.6 4 10 4s8.5 6 8.5 6-3.1 6-8.5 6-8.5-6-8.5-6Z" /><circle
          cx="10"
          cy="10"
          r="2.6"
        />{#if visible}<path d="m3 17 14-14" />{/if}</svg
      >
    {/if}
  </button>
</div>
