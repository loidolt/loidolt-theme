<script lang="ts">
  import {
    PinInput as PinInputPrimitive,
    REGEXP_ONLY_DIGITS,
    REGEXP_ONLY_DIGITS_AND_CHARS,
    type PinInputRootProps,
  } from 'bits-ui';
  import { cx } from '../utils.js';

  type Props = Omit<
    PinInputRootProps,
    | 'children'
    | 'maxlength'
    | 'value'
    | 'onValueChange'
    | 'onComplete'
    | 'inputId'
    | 'inputRef'
    | 'pattern'
    | 'inputmode'
    | 'textalign'
    | 'ref'
    | 'class'
  > & {
    value?: string;
    /** Number of characters in the code. */
    length?: number;
    /** `numeric` accepts digits and opens the number pad; `alphanumeric` accepts letters too. */
    type?: 'numeric' | 'alphanumeric';
    /** Accessible name of the input, e.g. "Verification code". */
    label: string;
    /** Draw a gap after every `groupSize` characters — `3` renders a six-digit code as 123 456. */
    groupSize?: number;
    /** Show dots instead of the characters. */
    mask?: boolean;
    /** The id of the underlying input, so a `Field` label can point at it. */
    id?: string;
    onValueChange?: (value: string) => void;
    /** Called with the code once every cell is filled. */
    onComplete?: (value: string) => void;
    class?: string;
    cellClass?: string;
    /** The hidden input that holds the code. */
    ref?: HTMLInputElement | null;
  };

  let {
    value = $bindable(''),
    length = 6,
    type = 'numeric',
    label,
    groupSize,
    mask = false,
    id,
    onValueChange,
    onComplete,
    class: className,
    cellClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  // Codes are often copied as "123-456" or "123 456"; keep only what the field accepts.
  const pasteTransformer = (text: string) => text.replace(/[\s-]/g, '');
</script>

<PinInputPrimitive.Root
  bind:value
  bind:inputRef={ref}
  maxlength={length}
  inputId={id}
  pattern={type === 'numeric' ? REGEXP_ONLY_DIGITS : REGEXP_ONLY_DIGITS_AND_CHARS}
  inputmode={type === 'numeric' ? 'numeric' : 'text'}
  aria-label={label}
  {pasteTransformer}
  {onValueChange}
  onComplete={(code: string) => onComplete?.(code)}
  class={cx('ldt-otp-input', className)}
  {...rest}
>
  {#snippet children({ cells })}
    {#each cells as cell, index (index)}
      {#if groupSize && index > 0 && index % groupSize === 0}<span
          class="ldt-otp-input__gap"
          aria-hidden="true"
        ></span>{/if}
      <PinInputPrimitive.Cell {cell} class={cx('ldt-otp-input__cell', cellClass)}>
        {#if cell.char}{mask ? '•' : cell.char}{/if}{#if cell.hasFakeCaret}<span
            class="ldt-otp-input__caret"
          ></span>{/if}
      </PinInputPrimitive.Cell>
    {/each}
  {/snippet}
</PinInputPrimitive.Root>
