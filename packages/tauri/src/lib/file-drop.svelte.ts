import { onDestroy } from 'svelte';
import { readDesktopFiles, type DesktopFile } from './files.js';
import { isTauri, listen, noop } from './platform.js';
import type { DragDropPayload, FsPlugin, Teardown, WebviewPlugin } from './types.js';

/** Anything that takes a batch of files: a `Dropzone` instance (`bind:this`) fits. */
export interface FileDropTarget {
  addFiles(files: File[]): unknown;
}

export interface FileDropOptions {
  /**
   * The web view: `getCurrentWebview` from `@tauri-apps/api/webview`, or the web view it returns.
   * Pass the function itself to stay browser-safe; it is only called inside a Tauri window.
   */
  webview: WebviewPlugin | (() => WebviewPlugin);
  /**
   * `@tauri-apps/plugin-fs`, to read the dropped files into `File`s. Without it only `onPaths`
   * hears about a drop.
   */
  fs?: Pick<FsPlugin, 'readFile'>;
  /**
   * Where the dropped files go: a `Dropzone` (`bind:this`), whose `addFiles()` filters them by its
   * `accept`, `maxSize` and `maxFiles` as for a drop of its own. A function is read at drop time,
   * so it can return a component that mounts later.
   */
  target?: FileDropTarget | null | (() => FileDropTarget | null | undefined);
  /** Called with the dropped files once they are read, before `target` gets them. */
  onFiles?: (files: DesktopFile[]) => void;
  /** Called with the dropped paths as they arrive, before anything is read. */
  onPaths?: (paths: string[]) => void;
  /** A dropped path that could not be read, such as a folder. The other files still arrive. */
  onError?: (error: unknown, path: string) => void;
}

export interface FileDrop {
  /** Reactive: files are being dragged over the window. Feed it to `Dropzone`'s `externalDragging`. */
  readonly dragging: boolean;
  /** Reactive: the paths being dragged, while `dragging`. */
  readonly paths: readonly string[];
  /** Stops listening. Safe to call twice; automatic when created during component initialisation. */
  destroy(): void;
}

const resolveTarget = (target: FileDropOptions['target']) =>
  typeof target === 'function' ? target() : target;

/**
 * Files dropped on the window, delivered as `File`s. A Tauri window takes OS file drops before
 * the page sees them (`dragDropEnabled`, on by default), so HTML drag and drop events never fire
 * for them; this listens to the web view's own drag and drop event instead, reads the dropped
 * paths with `@tauri-apps/plugin-fs`, and hands the files to `onFiles` and to `target`.
 *
 * ```svelte
 * <script lang="ts">
 *   import { getCurrentWebview } from '@tauri-apps/api/webview';
 *   import * as fs from '@tauri-apps/plugin-fs';
 *   import { Dropzone } from '@loidolt/theme-svelte';
 *   import { createFileDrop } from '@loidolt/theme-tauri';
 *
 *   let dropzone = $state<Dropzone>();
 *   const drop = createFileDrop({ webview: getCurrentWebview, fs, target: () => dropzone });
 * </script>
 *
 * <Dropzone bind:this={dropzone} window externalDragging={drop.dragging} onFiles={upload} />
 * ```
 *
 * In a browser (and on the server) it never fires and `dragging` stays `false`; the `Dropzone`'s
 * own `window` drop handling covers that case.
 */
export function createFileDrop(options: FileDropOptions): FileDrop {
  const { webview, fs, target, onFiles, onPaths, onError } = options;
  let dragging = $state(false);
  let paths = $state<readonly string[]>([]);
  let stopped = false;

  const reset = () => {
    dragging = false;
    paths = [];
  };

  const deliver = async (dropped: string[]) => {
    onPaths?.(dropped);
    if (!fs || dropped.length === 0) return;
    const files = await readDesktopFiles(fs, dropped, onError);
    if (stopped || files.length === 0) return;
    onFiles?.(files);
    resolveTarget(target)?.addFiles(files);
  };

  const handle = (payload: DragDropPayload) => {
    if (stopped) return;
    switch (payload.type) {
      case 'enter':
        dragging = true;
        paths = Array.isArray(payload.paths) ? payload.paths : [];
        break;
      case 'over':
        dragging = true;
        break;
      case 'leave':
        reset();
        break;
      case 'drop': {
        reset();
        void deliver(Array.isArray(payload.paths) ? payload.paths : []);
        break;
      }
    }
  };

  let unlisten: Teardown = noop;
  if (isTauri()) {
    try {
      const view = typeof webview === 'function' ? webview() : webview;
      unlisten = listen(view.onDragDropEvent(({ payload }) => handle(payload)));
    } catch {
      /* not a Tauri 2 web view after all */
    }
  }

  const destroy = () => {
    if (stopped) return;
    stopped = true;
    unlisten();
    reset();
  };
  try {
    onDestroy(destroy);
  } catch {
    /* module scope: the caller owns `destroy()` */
  }

  return {
    get dragging() {
      return dragging;
    },
    get paths() {
      return paths;
    },
    destroy,
  };
}
