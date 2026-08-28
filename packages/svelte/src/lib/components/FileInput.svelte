<script lang="ts">
  import type { HTMLInputAttributes } from 'svelte/elements';
  import { cx } from '../utils.js';

  // Input cannot render type="file" — its string `value` binding does not apply — so the
  // file picker gets its own component in the same clothes.
  interface Props extends Omit<HTMLInputAttributes, 'type' | 'value' | 'files' | 'class'> {
    accept?: string;
    multiple?: boolean;
    /** Fired when the user picks at least one file. */
    onFiles?: (files: FileList) => void;
    disabled?: boolean;
    /** Draws the full box instead of the default underline, like Input. */
    boxed?: boolean;
    class?: string;
    ref?: HTMLInputElement | null;
  }

  let {
    accept,
    multiple = false,
    onFiles,
    disabled = false,
    boxed = false,
    class: className,
    onchange,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  function handleChange(event: Event & { currentTarget: HTMLInputElement }) {
    onchange?.(event);
    const files = event.currentTarget.files;
    if (files && files.length > 0) onFiles?.(files);
  }
</script>

<input
  bind:this={ref}
  type="file"
  class={cx('ldt-input', 'ldt-file-input', boxed && 'ldt-input--boxed', className)}
  {accept}
  {multiple}
  {disabled}
  {...rest}
  onchange={handleChange}
/>
