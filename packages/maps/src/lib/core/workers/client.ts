import type { Feature, FeatureCollection, LngLat, LngLatBounds } from '../types.js';
import { createSpatialHandler } from './handler.js';
import type { SpatialRequest, SpatialResponse } from './protocol.js';

type Request = SpatialRequest extends infer R
  ? R extends { id: number }
    ? Omit<R, 'id'>
    : never
  : never;

export interface SpatialWorkerOptions {
  /** Starts the worker. Defaults to the one this package ships, found next to this file. */
  workerFactory?: () => Worker;
  /** Give up on a request after this many milliseconds. */
  timeout?: number;
}

export interface SpatialWorker {
  /** `worker` while a worker is answering; `main-thread` where none could start. */
  readonly mode: 'worker' | 'main-thread';
  /** Indexes a collection, replacing what was there. Resolves to the number of features indexed. */
  load(features: FeatureCollection, options?: { idProperty?: string }): Promise<number>;
  search(bounds: LngLatBounds, limit?: number): Promise<Feature[]>;
  nearest(point: LngLat, count?: number): Promise<Feature[]>;
  /** The loaded collection simplified for `zoom`. */
  simplify(zoom: number, pixels?: number): Promise<FeatureCollection>;
  terminate(): void;
}

const defaultWorker = () =>
  new Worker(new URL('./spatial.worker.js', import.meta.url), { type: 'module' });

/**
 * Spatial indexing and simplification off the main thread, so a map of tens of thousands of
 * features stays smooth while it pans. Falls back to the main thread — with the same answers —
 * where workers are unavailable (the server, tests) or the worker fails to start.
 */
export function createSpatialWorker(options: SpatialWorkerOptions = {}): SpatialWorker {
  const { timeout = 30_000 } = options;
  let nextId = 1;
  let worker: Worker | null = null;
  let local: ReturnType<typeof createSpatialHandler> | null = null;
  let lastLoad: Request | null = null;
  const pending = new Map<
    number,
    {
      request: Request;
      resolve: (value: unknown) => void;
      reject: (error: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    }
  >();

  const settle = (response: SpatialResponse) => {
    const entry = pending.get(response.id);
    if (!entry) return;
    pending.delete(response.id);
    clearTimeout(entry.timer);
    if (response.ok) entry.resolve(response.result);
    else entry.reject(new Error(response.error));
  };

  /** Moves to the main thread, replaying the last load so the index is not lost. */
  const fallBack = () => {
    worker?.terminate();
    worker = null;
    local ??= createSpatialHandler();
    const queued = [...pending];
    if (lastLoad && !queued.some(([, entry]) => entry.request === lastLoad)) {
      local({ ...lastLoad, id: 0 } as SpatialRequest);
    }
    for (const [id, entry] of queued) settle(local({ ...entry.request, id } as SpatialRequest));
  };

  try {
    if (options.workerFactory || typeof Worker !== 'undefined') {
      worker = (options.workerFactory ?? defaultWorker)();
      worker.addEventListener('message', (event: MessageEvent<SpatialResponse>) =>
        settle(event.data)
      );
      worker.addEventListener('error', fallBack);
    }
  } catch {
    worker = null;
  }
  if (!worker) local = createSpatialHandler();

  const send = <T>(request: Request): Promise<T> => {
    if (request.type === 'load') lastLoad = request;
    const id = nextId++;
    if (!worker) {
      const response = local!({ ...request, id } as SpatialRequest);
      return response.ok
        ? Promise.resolve(response.result as T)
        : Promise.reject(new Error(response.error));
    }
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        pending.delete(id);
        reject(new Error(`Spatial worker: "${request.type}" took longer than ${timeout} ms`));
      }, timeout);
      pending.set(id, { request, resolve: resolve as (value: unknown) => void, reject, timer });
      worker!.postMessage({ ...request, id });
    });
  };

  return {
    get mode() {
      return worker ? 'worker' : 'main-thread';
    },
    load: (features, { idProperty } = {}) => send({ type: 'load', features, idProperty }),
    search: (bounds, limit) => send({ type: 'search', bounds, limit }),
    nearest: (point, count) => send({ type: 'nearest', point, count }),
    simplify: (zoom, pixels) => send({ type: 'simplify', zoom, pixels }),
    terminate() {
      worker?.terminate();
      worker = null;
      for (const [id, entry] of pending) {
        clearTimeout(entry.timer);
        entry.reject(new Error('Spatial worker terminated'));
        pending.delete(id);
      }
      local ??= createSpatialHandler();
    },
  };
}
