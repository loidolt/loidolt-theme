import { isTauri, listen, noop } from './platform.js';
import type { EventModule, Teardown } from './types.js';

/** A second launch of the app, forwarded to the running one. */
export interface SecondInstance {
  /** The second process's command line, starting with the executable. */
  args: string[];
  /** Its working directory, against which relative paths in `args` resolve. */
  cwd: string;
  /**
   * The files it was asked to open: sent by Rust when it knows them (files opened from the macOS
   * Finder), otherwise read from `args` with {@link filesFromArgs}.
   */
  files: string[];
}

/** What the Rust side emits; `files` is optional. */
interface SecondInstancePayload {
  args?: string[];
  cwd?: string;
  files?: string[];
}

export interface SingleInstanceOptions {
  /** `@tauri-apps/api/event`. */
  event: EventModule;
  /** Called for each second launch, after Rust has focused the existing window. */
  onSecondInstance: (launch: SecondInstance) => void;
  /** The event Rust emits. Defaults to `'single-instance'`. */
  eventName?: string;
}

const windowsPath = /^[A-Za-z]:[\\/]|^\\\\/;
const scheme = /^[A-Za-z][A-Za-z0-9+.-]+:/;

/**
 * The file paths in a command line: everything after the executable that is not a flag
 * (`-x`, `--flag`) or a URL, with relative paths resolved against `cwd`. `file://` URLs become
 * paths. Everything after a lone `--` counts as a path, flags included.
 */
export function filesFromArgs(args: readonly string[], cwd = ''): string[] {
  const files: string[] = [];
  let literal = false;
  for (const arg of args.slice(1)) {
    if (!literal && arg === '--') {
      literal = true;
      continue;
    }
    if (!arg || (!literal && arg.startsWith('-'))) continue;
    if (arg.startsWith('file://')) {
      const path = fileUrlPath(arg);
      if (path) files.push(path);
      continue;
    }
    if (!windowsPath.test(arg) && scheme.test(arg)) continue;
    files.push(resolve(arg, cwd));
  }
  return files;
}

function fileUrlPath(url: string): string | null {
  try {
    const path = decodeURIComponent(new URL(url).pathname);
    // file:///C:/Users/… → C:/Users/…
    return /^\/[A-Za-z]:\//.test(path) ? path.slice(1) : path;
  } catch {
    return null;
  }
}

function resolve(path: string, cwd: string): string {
  if (path.startsWith('/') || windowsPath.test(path) || !cwd) return path;
  const separator = cwd.includes('\\') && !cwd.includes('/') ? '\\' : '/';
  const relative = path.replace(/^\.[\\/]/, '');
  return cwd.endsWith(separator) ? cwd + relative : cwd + separator + relative;
}

/**
 * Hands each second launch of the app to `onSecondInstance` with its arguments and files.
 * `tauri-plugin-single-instance` is Rust-only: register it first in `src-tauri/src/lib.rs` with a
 * callback that focuses the main window and emits the launch as an event (see the README); this
 * listens for that event. A no-op outside a Tauri window.
 */
export function handleSecondInstance(options: SingleInstanceOptions): Teardown {
  if (!isTauri()) return noop;
  const { event, onSecondInstance, eventName = 'single-instance' } = options;
  try {
    return listen(
      event.listen<SecondInstancePayload>(eventName, ({ payload }) => {
        const args = Array.isArray(payload?.args) ? payload.args : [];
        const cwd = typeof payload?.cwd === 'string' ? payload.cwd : '';
        const files = Array.isArray(payload?.files) ? payload.files : filesFromArgs(args, cwd);
        onSecondInstance({ args, cwd, files });
      })
    );
  } catch {
    return noop;
  }
}
