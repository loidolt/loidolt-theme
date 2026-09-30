<script lang="ts" generics="T extends string = string">
  import { Combobox as ComboboxPrimitive, type ComboboxInputProps } from 'bits-ui';
  import { tick, type Snippet } from 'svelte';
  import ListboxEntries from '../internal/ListboxEntries.svelte';
  import {
    filterEntries,
    flattenOptions,
    matchesQuery,
    type OptionEntry,
  } from '../internal/options.js';
  import type { Option } from '../types.js';
  import { cx } from '../utils.js';
  import LiveRegion from './LiveRegion.svelte';

  type Props = Omit<
    ComboboxInputProps,
    'value' | 'child' | 'children' | 'defaultValue' | 'clearOnDeselect' | 'oninput' | 'ref'
  > & {
    /** The selected values, in the order they were chosen. */
    value?: T[];
    /** Options, optionally in labelled groups. */
    options: OptionEntry<T>[];
    /** Accessible name when the control is not wrapped in a `Field` or `<label>`. */
    label?: string;
    /** Most values that can be chosen. Remaining options disable once it is reached. */
    max?: number;
    disabled?: boolean;
    required?: boolean;
    /** Submits each selected value under this name. */
    name?: string;
    /** How typing narrows the list. `false` when `onQueryChange` filters on a server. */
    filter?: ((option: Option<T>, query: string) => boolean) | false;
    query?: string;
    onQueryChange?: (query: string) => void;
    queryDebounce?: number;
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
    resultsText?: (count: number, selected: number) => string;
    maxText?: (max: number) => string;
    /** Accessible name of each chip's remove button. */
    removeLabel?: (label: string) => string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: T[]) => void;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    triggerLabel?: string;
    item?: Snippet<[Option<T>, { selected: boolean; highlighted: boolean }]>;
    /** Lands on the wrapper; the rest props land on the text input. */
    class?: string;
    contentClass?: string;
    ref?: HTMLElement | null;
  };

  let {
    value = $bindable([]),
    options,
    label,
    max,
    disabled = false,
    required = false,
    name,
    filter,
    query = $bindable(''),
    onQueryChange,
    queryDebounce = 0,
    loading = false,
    loadingText = 'Loading…',
    emptyText = 'No results',
    resultsText = (count, selected) =>
      `${count} ${count === 1 ? 'result' : 'results'}, ${selected} selected`,
    maxText = (limit) => `Up to ${limit} can be chosen`,
    removeLabel = (text) => `Remove ${text}`,
    open = $bindable(false),
    onOpenChange,
    onValueChange,
    boxed = false,
    triggerLabel = 'Show options',
    item,
    class: className,
    contentClass,
    onkeydown,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const flat = $derived(flattenOptions(options));
  const chosen = $derived(
    value.map((one) => flat.find((option) => option.value === one) ?? { value: one, label: one })
  );
  const full = $derived(max !== undefined && value.length >= max);
  const visible = $derived(
    filter === false || !query
      ? options
      : filterEntries(options, (option) => (filter ?? matchesQuery)(option, query))
  );
  const count = $derived(flattenOptions(visible).length);

  let text = $state('');
  let chips = $state<HTMLElement | null>(null);
  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));

  function setValue(next: T[]) {
    value = next;
    onValueChange?.(next);
  }

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    query = event.currentTarget.value;
    text = query;
    if (!onQueryChange) return;
    clearTimeout(timer);
    const next = query;
    if (queryDebounce > 0) timer = setTimeout(() => onQueryChange(next), queryDebounce);
    else onQueryChange(next);
  }

  async function handleValueChange(next: string[]) {
    // Bits writes the chosen label into the input; for a multi-select the input is for searching,
    // so hand it back empty. The two-step write is what makes the prop change reach Bits.
    const option = flat.find((one) => one.value === next[next.length - 1]);
    text = option?.label ?? '';
    onValueChange?.(next as T[]);
    await tick();
    text = '';
    query = '';
  }

  function handleOpenChange(next: boolean) {
    if (!next) {
      text = '';
      query = '';
    }
    onOpenChange?.(next);
  }

  async function remove(target: T, index: number) {
    setValue(value.filter((one) => one !== target));
    await tick();
    // Focus follows the removal: the next chip, else the previous one, else the input.
    const buttons = chips?.querySelectorAll<HTMLButtonElement>('.ldt-chip__remove') ?? [];
    (buttons[index] ?? buttons[index - 1] ?? ref)?.focus();
  }

  function handleKeydown(event: KeyboardEvent & { currentTarget: HTMLInputElement }) {
    onkeydown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === 'Backspace' && event.currentTarget.value === '' && value.length) {
      setValue(value.slice(0, -1));
    }
  }

  const announcement = $derived(
    !open
      ? ''
      : loading
        ? loadingText
        : [count === 0 ? emptyText : resultsText(count, value.length), full && maxText(max!)]
            .filter(Boolean)
            .join('. ')
  );
</script>

<ComboboxPrimitive.Root
  type="multiple"
  bind:value={() => value, (next) => (value = next as T[])}
  bind:open
  inputValue={text}
  items={flat}
  {disabled}
  {required}
  {name}
  onOpenChange={handleOpenChange}
  onValueChange={handleValueChange}
>
  <div
    class={cx('ldt-combobox', 'ldt-multi-select', boxed && 'ldt-combobox--boxed', className)}
    data-disabled={disabled ? '' : undefined}
  >
    {#if chosen.length}
      <ul class="ldt-multi-select__chips" bind:this={chips}>
        {#each chosen as option, index (option.value)}
          <li class="ldt-chip">
            <span>{option.label}</span>
            <button
              type="button"
              class="ldt-chip__remove"
              aria-label={removeLabel(option.label)}
              {disabled}
              onclick={() => remove(option.value, index)}
              ><svg viewBox="0 0 10 10" width="10" height="10" aria-hidden="true" focusable="false"
                ><path d="m2 2 6 6M8 2 2 8" stroke="currentColor" stroke-width="1.4" /></svg
              ></button
            >
          </li>
        {/each}
      </ul>
    {/if}
    <ComboboxPrimitive.Input
      bind:ref
      class="ldt-combobox__input"
      aria-label={label}
      autocomplete="off"
      {...rest}
      oninput={handleInput}
      onkeydown={handleKeydown}
    />
    <ComboboxPrimitive.Trigger class="ldt-combobox__trigger" aria-label={triggerLabel}>
      <svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true" focusable="false"
        ><path d="M2 4.5 6 8.5l4-4" fill="none" stroke="currentColor" stroke-width="1.5" /></svg
      >
    </ComboboxPrimitive.Trigger>
  </div>
  <ComboboxPrimitive.Portal>
    <ComboboxPrimitive.Content class={cx('ldt-listbox', contentClass)} sideOffset={4}>
      {#if loading}
        <div class="ldt-listbox__empty" aria-hidden="true">{loadingText}</div>
      {:else if count === 0}
        <div class="ldt-listbox__empty" aria-hidden="true">{emptyText}</div>
      {:else}
        <ListboxEntries
          entries={visible}
          {item}
          blocked={(option) => full && !value.includes(option.value)}
        />
      {/if}
    </ComboboxPrimitive.Content>
  </ComboboxPrimitive.Portal>
</ComboboxPrimitive.Root>
<LiveRegion message={announcement} />
