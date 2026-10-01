/*
 * The spatial worker. It only relays messages to the same handler the client can run itself —
 * all the logic lives in `handler.ts`, where it can be tested without a worker.
 *
 * Bundlers that pre-bundle dependencies can lose the worker URL the client computes; import
 * this file through the bundler instead (`@loidolt/theme-maps/spatial.worker?worker` with Vite)
 * and pass it as `workerFactory`.
 */
import { createSpatialHandler } from './handler.js';
import type { SpatialRequest } from './protocol.js';

const handle = createSpatialHandler();
const scope = self as unknown as {
  onmessage: ((event: MessageEvent<SpatialRequest>) => void) | null;
  postMessage(message: unknown): void;
};

scope.onmessage = (event) => scope.postMessage(handle(event.data));
