import { vi } from 'vitest';
import type { EChartsCore, EChartsInstance } from '../../src/lib/echarts.js';

type Handler = (params: Record<string, unknown>) => void;

/** Records what a chart asks of ECharts, without drawing anything. */
export class FakeInstance implements EChartsInstance {
  calls: Array<{ option: Record<string, unknown>; settings?: Record<string, unknown> }> = [];
  handlers = new Map<string, Set<Handler>>();
  disposed = false;
  resize = vi.fn();
  dispatchAction = vi.fn();

  constructor(
    readonly element: HTMLElement,
    readonly settings?: Record<string, unknown>
  ) {}

  /** The option most recently set. */
  get option() {
    return this.calls.at(-1)?.option ?? {};
  }

  setOption(option: Record<string, unknown>, settings?: Record<string, unknown>) {
    this.calls.push({ option, settings });
  }

  on(event: string, handler: Handler) {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler?: Handler) {
    if (handler) this.handlers.get(event)?.delete(handler);
    else this.handlers.delete(event);
  }

  emit(event: string, params: Record<string, unknown>) {
    for (const handler of this.handlers.get(event) ?? []) handler(params);
  }

  dispose() {
    this.disposed = true;
  }

  isDisposed() {
    return this.disposed;
  }
}

export function createFakeECharts() {
  const instances: FakeInstance[] = [];
  const used: unknown[] = [];
  const core: EChartsCore = {
    init: vi.fn((element: HTMLElement, _theme?: unknown, settings?: Record<string, unknown>) => {
      const instance = new FakeInstance(element, settings);
      instances.push(instance);
      return instance;
    }),
    use: vi.fn((extensions: unknown[]) => {
      used.push(...extensions);
    }),
  };
  return { core, instances, used };
}
