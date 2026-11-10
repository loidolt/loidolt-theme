<script lang="ts">
  import type { Snippet } from 'svelte';
  import type { HTMLAttributes } from 'svelte/elements';
  import { createAnnouncer } from '../announcer.svelte.js';
  import { filterFiles, type FileFilterResult, type FileRejection } from '../file-accept.js';
  import { cx, describedBy } from '../utils.js';
  import LiveRegion from './LiveRegion.svelte';

  interface Props extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'class'> {
    /** Same syntax as `<input accept>`: extensions (`.pdf`), MIME types, or `type/*`. */
    accept?: string;
    multiple?: boolean;
    /** Submits the accepted files with a form, through the real file input. */
    name?: string;
    required?: boolean;
    disabled?: boolean;
    /** Largest accepted file, in bytes. */
    maxSize?: number;
    /** Most files accepted from one batch, when `multiple`. */
    maxFiles?: number;
    /**
     * Also take files dropped anywhere on the page. While files are dragged over the window the
     * root gets `data-window-dragging` and an overlay covers the viewport.
     */
    window?: boolean;
    /**
     * Fired for every batch that arrives — drop, picker, or `addFiles()` — with the files that
     * passed `accept`, `maxSize` and `maxFiles`, and the ones that did not.
     */
    onFiles?: (accepted: File[], rejected: FileRejection[]) => void;
    /** The prompt, and the accessible name of the file input. */
    label?: string;
    /** The visible cue that the area opens the file picker. */
    browseLabel?: string;
    /** Guidance under the prompt, such as accepted types and limits. */
    hint?: string;
    /** Shown and announced when files are turned away. */
    rejectedLabel?: (rejected: FileRejection[]) => string;
    /** Announced to screen readers when files are accepted. */
    addedLabel?: (accepted: File[]) => string;
    /** Replaces the default prompt inside the area. `label` stays the accessible name. */
    children?: Snippet<[{ dragging: boolean }]>;
    /** The id of the file input, e.g. for a `Field` label's `for`. */
    id?: string;
    'aria-describedby'?: string;
    class?: string;
    ref?: HTMLDivElement | null;
    inputRef?: HTMLInputElement | null;
  }

  const generatedId = $props.id();

  const reasonText: Record<FileRejection['reason'], string> = {
    type: 'is not an accepted file type',
    size: 'is too large',
    count: 'is over the file limit',
  };

  let {
    accept,
    multiple = false,
    name,
    required = false,
    disabled = false,
    maxSize,
    maxFiles,
    window: windowTarget = false,
    onFiles,
    label = 'Drop files here',
    browseLabel = 'or choose files',
    hint,
    rejectedLabel = (rejected) =>
      rejected.length > 3
        ? `${rejected.length} files were not added.`
        : rejected.map(({ file, reason }) => `${file.name} ${reasonText[reason]}.`).join(' '),
    addedLabel = (accepted) =>
      accepted.length === 1 ? `${accepted[0].name} added.` : `${accepted.length} files added.`,
    children,
    id = `${generatedId}-input`,
    'aria-describedby': ariaDescribedBy,
    class: className,
    ref = $bindable(null),
    inputRef = $bindable(null),
    ...rest
  }: Props = $props();

  const hintId = `${generatedId}-hint`;
  const errorId = `${generatedId}-error`;
  const announcer = createAnnouncer();

  /** Nested dragenter/dragleave pairs: children fire their own, so a flag would flicker. */
  let areaDepth = $state(0);
  let windowDepth = $state(0);
  let error = $state('');
  /** What the input holds for a form: the last batch that had accepted files. */
  let current: File[] = [];

  const dragging = $derived(areaDepth > 0);
  const windowDragging = $derived(windowTarget && windowDepth > 0);

  const hasFiles = (event: DragEvent) =>
    Array.from(event.dataTransfer?.types ?? []).includes('Files');

  function syncInput() {
    if (!inputRef || typeof DataTransfer === 'undefined') return;
    try {
      const transfer = new DataTransfer();
      for (const file of current) transfer.items.add(file);
      inputRef.files = transfer.files;
    } catch {
      /* a browser that will not let script set `files`: the callback still has them */
    }
  }

  function receive(files: Iterable<File> | ArrayLike<File>): FileFilterResult {
    const result = filterFiles(files, { accept, multiple, maxSize, maxFiles });
    const { accepted, rejected } = result;
    if (!accepted.length && !rejected.length) return result;
    if (accepted.length) current = accepted;
    syncInput();
    error = rejected.length ? rejectedLabel(rejected) : '';
    const added = accepted.length ? addedLabel(accepted) : '';
    announcer.announce([added, error].filter(Boolean).join(' '), {
      politeness: rejected.length ? 'assertive' : 'polite',
    });
    onFiles?.(accepted, rejected);
    return result;
  }

  /**
   * Feeds files from any source — a native window drop, a paste, a test — through the same
   * filtering, message and `onFiles` callback as a drop. Ignored while disabled.
   */
  export function addFiles(files: Iterable<File> | ArrayLike<File>): FileFilterResult {
    if (disabled) return { accepted: [], rejected: [] };
    return receive(files);
  }

  /** Opens the native file picker. Call it from a user gesture. */
  export function open() {
    if (!disabled) inputRef?.click();
  }

  function onDragEnter(event: DragEvent) {
    if (disabled || !hasFiles(event)) return;
    event.preventDefault();
    areaDepth += 1;
  }

  function onDragOver(event: DragEvent) {
    if (disabled || !hasFiles(event)) return;
    // Cancelling dragover is what makes an element a drop target.
    event.preventDefault();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  function onDragLeave(event: DragEvent) {
    if (disabled || !hasFiles(event)) return;
    areaDepth = Math.max(0, areaDepth - 1);
  }

  function onDrop(event: DragEvent) {
    areaDepth = 0;
    if (disabled || !hasFiles(event)) return;
    // In window mode the window listener takes it, so a drop on the area is not counted twice.
    if (windowTarget) return;
    event.preventDefault();
    receive(event.dataTransfer?.files ?? []);
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    // Browsers disagree on which keys open a file input; make both do it everywhere.
    event.preventDefault();
    open();
  }

  function onChange(event: Event & { currentTarget: HTMLInputElement }) {
    const files = Array.from(event.currentTarget.files ?? []);
    if (files.length) receive(files);
  }

  $effect(() => {
    if (!windowTarget || disabled) return;
    const target = globalThis.window;
    const enter = (event: DragEvent) => {
      if (hasFiles(event)) windowDepth += 1;
    };
    const leave = (event: DragEvent) => {
      if (hasFiles(event)) windowDepth = Math.max(0, windowDepth - 1);
    };
    const over = (event: DragEvent) => {
      if (!hasFiles(event)) return;
      event.preventDefault();
      if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
    };
    const drop = (event: DragEvent) => {
      windowDepth = 0;
      areaDepth = 0;
      // Something else on the page (another drop target) already took this drop.
      if (!hasFiles(event) || event.defaultPrevented) return;
      event.preventDefault();
      receive(event.dataTransfer?.files ?? []);
    };
    const end = () => {
      windowDepth = 0;
      areaDepth = 0;
    };
    target.addEventListener('dragenter', enter);
    target.addEventListener('dragleave', leave);
    target.addEventListener('dragover', over);
    target.addEventListener('drop', drop);
    target.addEventListener('dragend', end);
    return () => {
      target.removeEventListener('dragenter', enter);
      target.removeEventListener('dragleave', leave);
      target.removeEventListener('dragover', over);
      target.removeEventListener('drop', drop);
      target.removeEventListener('dragend', end);
      windowDepth = 0;
    };
  });
</script>

<div
  bind:this={ref}
  class={cx('ldt-dropzone', className)}
  data-dragging={dragging || undefined}
  data-window-dragging={windowDragging || undefined}
  data-disabled={disabled || undefined}
  {...rest}
>
  <label
    class="ldt-dropzone__target"
    ondragenter={onDragEnter}
    ondragover={onDragOver}
    ondragleave={onDragLeave}
    ondrop={onDrop}
  >
    <input
      bind:this={inputRef}
      {id}
      class="ldt-dropzone__input ldt-sr-only"
      type="file"
      {accept}
      {multiple}
      {name}
      {required}
      {disabled}
      aria-label={label}
      aria-describedby={describedBy(ariaDescribedBy, hint && hintId, error && errorId)}
      onkeydown={onKeydown}
      onchange={onChange}
    />
    {#if children}
      {@render children({ dragging: dragging || windowDragging })}
    {:else}
      <span class="ldt-dropzone__label">{label}</span>
      <span class="ldt-dropzone__browse">{browseLabel}</span>
    {/if}
    {#if hint}<span class="ldt-dropzone__hint" id={hintId}>{hint}</span>{/if}
  </label>
  {#if error}<p class="ldt-dropzone__error" id={errorId}>{error}</p>{/if}
  <LiveRegion message={announcer.message} politeness={announcer.politeness} />
  {#if windowDragging}
    <div class="ldt-dropzone__overlay" aria-hidden="true">
      <span class="ldt-dropzone__overlay-label">{label}</span>
    </div>
  {/if}
</div>
