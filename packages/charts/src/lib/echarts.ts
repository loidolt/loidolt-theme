/*
 * ECharts is a peer dependency, but it is never imported at module scope: a chart loads it from
 * an effect, so server rendering never evaluates it and pages that show no chart never download
 * it. Each chart type pulls in only the ECharts pieces it draws with (see `./echarts/`).
 *
 * `setEChartsLoader` replaces how the core is loaded — to use a global build from a script tag,
 * or a stand-in under test.
 */

/** The slice of an ECharts instance the components use. */
export interface EChartsInstance {
  setOption(option: Record<string, unknown>, options?: Record<string, unknown>): void;
  on(event: string, handler: (params: Record<string, unknown>) => void): void;
  off(event: string, handler?: (params: Record<string, unknown>) => void): void;
  resize(options?: Record<string, unknown>): void;
  dispatchAction(action: Record<string, unknown>): void;
  dispose(): void;
  isDisposed(): boolean;
}

/** The slice of `echarts/core` the components use. */
export interface EChartsCore {
  init(
    element: HTMLElement,
    theme?: string | object | null,
    options?: Record<string, unknown>
  ): EChartsInstance;
  use(extensions: unknown[]): void;
}

export type EChartsLoader = () => Promise<EChartsCore> | EChartsCore;

const defaultLoader: EChartsLoader = () => import('echarts/core') as Promise<EChartsCore>;

let registered: EChartsLoader | null = null;
let cached: Promise<EChartsCore | null> | null = null;

/** Replaces how `echarts/core` is loaded. `null` restores the default dynamic import. */
export function setEChartsLoader(loader: EChartsLoader | null): void {
  registered = loader;
  cached = null;
}

/** Loads the ECharts core once. Resolves `null` rather than rejecting when it cannot. */
export function loadECharts(): Promise<EChartsCore | null> {
  cached ??= Promise.resolve()
    .then(registered ?? defaultLoader)
    .then((core) => core ?? null)
    .catch(() => null);
  return cached;
}

/** Chart extensions: resolves to the ECharts modules one chart type needs. */
export type ChartExtensions = () => Promise<unknown[]>;
