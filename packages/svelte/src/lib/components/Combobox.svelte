<script lang="ts" generics="T extends string = string">
  import { Combobox as ComboboxPrimitive, type ComboboxInputProps } from 'bits-ui';
  import { untrack, type Snippet } from 'svelte';
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
    disabled?: boolean;
    required?: boolean;
    /** Submits the selected value with a form. */
    name?: string;
    /** The selected value, or `''` for none. */
    value?: T | '';
    /** Options, optionally in labelled groups. */
    options: OptionEntry<T>[];
    /** Accessible name when the combobox is not wrapped in a `Field` or `<label>`. */
    label?: string;
    /**
     * How typing narrows the list. Defaults to a case- and accent-insensitive match on the label.
     * Pass `false` when the options already come back filtered — from a server search driven by
     * `onQueryChange`.
     */
    filter?: ((option: Option<T>, query: string) => boolean) | false;
    /** The text typed so far. Bindable. */
    query?: string;
    /** Called with the typed text, after `queryDebounce` — the hook for a server-side search. */
    onQueryChange?: (query: string) => void;
    /** Milliseconds to wait after the last keystroke before calling `onQueryChange`. */
    queryDebounce?: number;
    /** Results are on their way; shown in place of the list and announced. */
    loading?: boolean;
    loadingText?: string;
    emptyText?: string;
    /** What screen readers hear as the list narrows. */
    resultsText?: (count: number) => string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onValueChange?: (value: T | '') => void;
    /** Choosing the selected option again clears it. */
    allowDeselect?: boolean;
    /** Draws the full box instead of the default underline. */
    boxed?: boolean;
    /** Accessible name of the button that opens the list. */
    triggerLabel?: string;
    /** Custom row content. The check mark for the selected row is still drawn. */
    item?: Snippet<[Option<T>, { selected: boolean; highlighted: boolean }]>;
    /** Lands on the wrapper; the rest props land on the text input. */
    class?: string;
    /** Class for the portaled list. */
    contentClass?: string;
    /** The text input. */
    ref?: HTMLElement | null;
  };

  let {
    value = $bindable(''),
    options,
    label,
    filter,
    query = $bindable(''),
    onQueryChange,
    queryDebounce = 0,
    loading = false,
    loadingText = 'Loading…',
    emptyText = 'No results',
    resultsText = (count) => `${count} ${count === 1 ? 'result' : 'results'}`,
    open = $bindable(false),
    onOpenChange,
    onValueChange,
    allowDeselect = false,
    boxed = false,
    triggerLabel = 'Show options',
    item,
    disabled = false,
    required = false,
    name,
    class: className,
    contentClass,
    ref = $bindable(null),
    ...rest
  }: Props = $props();

  const flat = $derived(flattenOptions(options));
  const selected = $derived(flat.find((option) => option.value === value));
  const visible = $derived(
    filter === false || !query
      ? options
      : filterEntries(options, (option) => (filter ?? matchesQuery)(option, query))
  );
  const count = $derived(flattenOptions(visible).length);

  // What the input shows. Bits owns it while the user types; closing snaps it back to the
  // selection, so a half-typed query never masquerades as the value.
  // Seeded from the selection so the server renders it too; effects never run during SSR.
  let text = $state(untrack(() => selected?.label ?? ''));
  $effect.pre(() => {
    if (!open) text = selected?.label ?? '';
  });

  let timer: ReturnType<typeof setTimeout> | undefined;
  $effect(() => () => clearTimeout(timer));

  function handleInput(event: Event & { currentTarget: HTMLInputElement }) {
    query = event.currentTarget.value;
    text = query;
    if (!onQueryChange) return;
    clearTimeout(timer);
    const next = query;
    if (queryDebounce > 0) timer = setTimeout(() => onQueryChange(next), queryDebounce);
    else onQueryChange(next);
  }

  function handleOpenChange(next: boolean) {
    if (!next) query = '';
    onOpenChange?.(next);
  }

  function handleValueChange(next: string) {
    const option = flat.find((one) => one.value === next);
    text = option?.label ?? '';
    onValueChange?.(next as T | '');
  }

  const announcement = $derived(
    !open ? '' : loading ? loadingText : count === 0 ? emptyText : resultsText(count)
  );
</script>

<ComboboxPrimitive.Root
  type="single"
  bind:value={() => value, (next) => (value = next as T | '')}
  bind:open
  inputValue={text}
  items={flat}
  {disabled}
  {required}
  {name}
  {allowDeselect}
  onOpenChange={handleOpenChange}
  onValueChange={handleValueChange}
>
  <div class={cx('ldt-combobox', boxed && 'ldt-combobox--boxed', className)}>
    <ComboboxPrimitive.Input
      bind:ref
      class="ldt-combobox__input"
      aria-label={label}
      autocomplete="off"
      {...rest}
      oninput={handleInput}
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
        <ListboxEntries entries={visible} {item} />
      {/if}
    </ComboboxPrimitive.Content>
  </ComboboxPrimitive.Portal>
</ComboboxPrimitive.Root>
<LiveRegion message={announcement} />
