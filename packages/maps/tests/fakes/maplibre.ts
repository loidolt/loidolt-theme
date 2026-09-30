/*
 * Just enough of MapLibre to test the components against, in jsdom (which has no WebGL). It
 * keeps real state — sources, layers, paint, controls, the view — so tests assert on what the
 * map holds rather than on which calls were made.
 */
type Handler = (event: any) => void;

class Emitter {
  handlers = new Map<string, Set<Handler>>();
  layerHandlers = new Map<string, Set<{ layer: string; handler: Handler }>>();

  on(type: string, layerOrHandler: string | Handler, maybe?: Handler) {
    if (typeof layerOrHandler === 'string') {
      if (!this.layerHandlers.has(type)) this.layerHandlers.set(type, new Set());
      this.layerHandlers.get(type)!.add({ layer: layerOrHandler, handler: maybe! });
    } else {
      if (!this.handlers.has(type)) this.handlers.set(type, new Set());
      this.handlers.get(type)!.add(layerOrHandler);
    }
    return this;
  }

  off(type: string, layerOrHandler: string | Handler, maybe?: Handler) {
    if (typeof layerOrHandler === 'string') {
      for (const entry of this.layerHandlers.get(type) ?? []) {
        if (entry.layer === layerOrHandler && entry.handler === maybe) {
          this.layerHandlers.get(type)!.delete(entry);
        }
      }
    } else {
      this.handlers.get(type)?.delete(layerOrHandler);
    }
    return this;
  }

  once(type: string, handler: Handler) {
    const wrapped = (event: unknown) => {
      this.off(type, wrapped);
      handler(event);
    };
    return this.on(type, wrapped);
  }

  fire(type: string, event: Record<string, unknown> = {}) {
    for (const handler of [...(this.handlers.get(type) ?? [])]) handler({ type, ...event });
  }

  /** Fires a layer event, as a pointer over a feature of `layer` would. */
  fireLayer(type: string, layer: string, event: Record<string, unknown> = {}) {
    for (const entry of [...(this.layerHandlers.get(type) ?? [])]) {
      if (entry.layer === layer) entry.handler({ type, ...event });
    }
  }

  listenerCount(type: string, layer?: string) {
    return layer
      ? [...(this.layerHandlers.get(type) ?? [])].filter((entry) => entry.layer === layer).length
      : (this.handlers.get(type)?.size ?? 0);
  }
}

type Layer = Record<string, any> & { id: string; type: string };

export class FakeMap extends Emitter {
  static instances: FakeMap[] = [];
  options: Record<string, any>;
  container: HTMLElement;
  canvas = document.createElement('canvas');
  canvasContainer = document.createElement('div');
  controls: Array<{ control: any; position?: string; element?: HTMLElement }> = [];
  style: { sources: Record<string, any>; layers: Layer[]; glyphs?: string } = {
    sources: {},
    layers: [],
  };
  styleInput: unknown;
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  featureStates = new Map<string, Record<string, unknown>>();
  removed = false;
  calls: Array<[string, ...unknown[]]> = [];

  constructor(options: Record<string, any>) {
    super();
    if (FakeMap.failNext) {
      FakeMap.failNext = false;
      throw new Error('Failed to initialize WebGL');
    }
    this.options = options;
    this.container = options.container;
    this.canvas.setAttribute('aria-label', options.locale?.['Map.Title'] ?? 'Map');
    this.canvas.setAttribute('role', 'region');
    this.canvas.tabIndex = 0;
    this.canvasContainer.append(this.canvas);
    this.container.append(this.canvasContainer);
    this.center = options.center ?? [0, 0];
    this.zoom = options.zoom ?? 0;
    this.bearing = options.bearing ?? 0;
    this.pitch = options.pitch ?? 0;
    FakeMap.instances.push(this);
    this.loadStyle(options.style);
  }

  static failNext = false;
  /** Holds back `style.load`, as a slow or broken style server would. */
  static holdStyle = false;

  private loadStyle(input: unknown) {
    this.styleInput = input;
    const spec =
      typeof input === 'object' && input
        ? structuredClone(input as any)
        : { sources: {}, layers: [] };
    this.style = {
      sources: { ...spec.sources },
      layers: [...(spec.layers ?? [])],
      glyphs: spec.glyphs,
    };
    if (FakeMap.holdStyle) return;
    queueMicrotask(() => {
      if (!this.removed) this.fire('style.load');
    });
  }

  setStyle(input: unknown) {
    this.calls.push(['setStyle', input]);
    this.loadStyle(input);
    return this;
  }

  getStyle() {
    return this.style;
  }

  getCanvas() {
    return this.canvas;
  }

  getCanvasContainer() {
    return this.canvasContainer;
  }

  getContainer() {
    return this.container;
  }

  addControl(control: any, position?: string) {
    const element = control.onAdd?.(this);
    if (element) this.container.append(element);
    this.controls.push({ control, position, element });
    return this;
  }

  removeControl(control: any) {
    const entry = this.controls.find((item) => item.control === control);
    control.onRemove?.(this);
    this.controls = this.controls.filter((item) => item !== entry);
    return this;
  }

  addSource(id: string, spec: Record<string, any>) {
    if (this.style.sources[id]) throw new Error(`Source "${id}" already exists.`);
    const source: Record<string, any> = { ...spec };
    source.setData = (data: unknown) => {
      source.data = data;
      this.calls.push(['setData', id, data]);
    };
    source.getClusterExpansionZoom = async () => 9;
    this.style.sources[id] = source;
    this.fire('sourcedata', { sourceId: id });
    return this;
  }

  getSource(id: string) {
    return this.style.sources[id];
  }

  removeSource(id: string) {
    if (this.style.layers.some((layer) => layer.source === id)) {
      throw new Error(`Source "${id}" cannot be removed while layer uses it.`);
    }
    delete this.style.sources[id];
    return this;
  }

  addLayer(layer: Layer, beforeId?: string) {
    if (this.getLayer(layer.id)) throw new Error(`Layer "${layer.id}" already exists.`);
    if (layer.source && !this.style.sources[layer.source]) {
      throw new Error(`Source "${layer.source}" not found.`);
    }
    const copy = structuredClone(layer);
    const index = beforeId ? this.style.layers.findIndex((item) => item.id === beforeId) : -1;
    if (index === -1) this.style.layers.push(copy);
    else this.style.layers.splice(index, 0, copy);
    this.calls.push(['addLayer', layer.id, beforeId]);
    return this;
  }

  getLayer(id: string) {
    return this.style.layers.find((layer) => layer.id === id);
  }

  removeLayer(id: string) {
    this.style.layers = this.style.layers.filter((layer) => layer.id !== id);
    this.calls.push(['removeLayer', id]);
    return this;
  }

  moveLayer(id: string, beforeId?: string) {
    const layer = this.getLayer(id)!;
    this.style.layers = this.style.layers.filter((item) => item !== layer);
    const index = beforeId ? this.style.layers.findIndex((item) => item.id === beforeId) : -1;
    if (index === -1) this.style.layers.push(layer);
    else this.style.layers.splice(index, 0, layer);
    this.calls.push(['moveLayer', id, beforeId]);
    return this;
  }

  setPaintProperty(id: string, name: string, value: unknown) {
    const layer = this.getLayer(id)!;
    layer.paint = { ...layer.paint, [name]: value };
    if (value === null) delete layer.paint[name];
    this.calls.push(['setPaintProperty', id, name, value]);
    return this;
  }

  setLayoutProperty(id: string, name: string, value: unknown) {
    const layer = this.getLayer(id)!;
    layer.layout = { ...layer.layout, [name]: value };
    if (value === null) delete layer.layout[name];
    this.calls.push(['setLayoutProperty', id, name, value]);
    return this;
  }

  setFilter(id: string, filter: unknown) {
    this.getLayer(id)!.filter = filter ?? undefined;
    this.calls.push(['setFilter', id, filter]);
    return this;
  }

  setLayerZoomRange(id: string, min: number, max: number) {
    Object.assign(this.getLayer(id)!, { minzoom: min, maxzoom: max });
    return this;
  }

  setFeatureState(target: { source: string; id: string | number }, state: Record<string, unknown>) {
    const key = `${target.source}:${target.id}`;
    this.featureStates.set(key, { ...this.featureStates.get(key), ...state });
  }

  queryRenderedFeatures() {
    return [{ type: 'Feature', properties: { name: 'Under the pointer' }, geometry: null }];
  }

  getCenter() {
    return { lng: this.center[0], lat: this.center[1] };
  }

  getZoom() {
    return this.zoom;
  }

  getBearing() {
    return this.bearing;
  }

  getPitch() {
    return this.pitch;
  }

  getBounds() {
    const [lng, lat] = this.center;
    const span = 360 / 2 ** (this.zoom + 1);
    return {
      getWest: () => lng - span,
      getEast: () => lng + span,
      getSouth: () => lat - span / 2,
      getNorth: () => lat + span / 2,
    };
  }

  private moveTo(
    options: { center?: [number, number]; zoom?: number; bearing?: number; pitch?: number },
    method: string,
    originalEvent?: Event
  ) {
    this.calls.push([method, options]);
    if (options.center) this.center = [...options.center] as [number, number];
    if (options.zoom !== undefined) this.zoom = options.zoom;
    if (options.bearing !== undefined) this.bearing = options.bearing;
    if (options.pitch !== undefined) this.pitch = options.pitch;
    this.fire('move');
    this.fire('moveend', originalEvent ? { originalEvent } : {});
    return this;
  }

  jumpTo(options: any) {
    return this.moveTo(options, 'jumpTo');
  }

  easeTo(options: any) {
    return this.moveTo(options, 'easeTo');
  }

  flyTo(options: any) {
    return this.moveTo(options, 'flyTo');
  }

  fitBounds(bounds: [[number, number], [number, number]], options: any) {
    const [[west, south], [east, north]] = bounds;
    this.calls.push(['fitBounds', bounds, options]);
    return this.moveTo({ center: [(west + east) / 2, (south + north) / 2], zoom: 10 }, 'fit');
  }

  /** Pans as MapLibre's keyboard handler does, with the key press as the original event. */
  keyboardPan(center: [number, number]) {
    return this.moveTo({ center }, 'keyboard', new KeyboardEvent('keydown', { key: 'ArrowRight' }));
  }

  resize() {}

  remove() {
    this.removed = true;
    this.container.replaceChildren();
    this.calls.push(['remove']);
  }
}

export class FakeMarker extends Emitter {
  element: HTMLElement;
  options: Record<string, any>;
  lngLat: [number, number] = [0, 0];
  draggable: boolean;
  map: FakeMap | null = null;

  constructor(options: Record<string, any>) {
    super();
    this.options = options;
    this.element = options.element;
    this.draggable = Boolean(options.draggable);
  }

  setLngLat(lngLat: [number, number]) {
    this.lngLat = [...lngLat] as [number, number];
    return this;
  }

  getLngLat() {
    return { lng: this.lngLat[0], lat: this.lngLat[1] };
  }

  setDraggable(value: boolean) {
    this.draggable = value;
    return this;
  }

  addTo(map: FakeMap) {
    this.map = map;
    map.getCanvasContainer().append(this.element);
    return this;
  }

  remove() {
    this.element.remove();
    this.map = null;
    return this;
  }
}

export class FakePopup extends Emitter {
  options: Record<string, any>;
  content: HTMLElement | null = null;
  lngLat: [number, number] | null = null;
  wrapper = document.createElement('div');
  map: FakeMap | null = null;

  constructor(options: Record<string, any>) {
    super();
    this.options = options;
    this.wrapper.className = `maplibregl-popup ${options.className ?? ''}`;
  }

  setDOMContent(node: HTMLElement) {
    this.content = node;
    this.wrapper.append(node);
    return this;
  }

  setLngLat(lngLat: [number, number]) {
    this.lngLat = lngLat;
    return this;
  }

  isOpen() {
    return this.map !== null;
  }

  addTo(map: FakeMap) {
    this.map = map;
    map.getContainer().append(this.wrapper);
    this.fire('open');
    return this;
  }

  remove() {
    if (!this.map) return this;
    this.wrapper.remove();
    this.map = null;
    this.fire('close');
    return this;
  }
}

const control = (name: string) =>
  class {
    options: unknown;
    name = name;
    constructor(options?: unknown) {
      this.options = options;
    }
    onAdd() {
      const element = document.createElement('div');
      element.dataset.control = name;
      return element;
    }
    onRemove() {}
  };

export function createFakeMapLibre() {
  FakeMap.instances = [];
  FakeMap.holdStyle = false;
  return {
    Map: FakeMap,
    Marker: FakeMarker,
    Popup: FakePopup,
    NavigationControl: control('navigation'),
    ScaleControl: control('scale'),
    FullscreenControl: control('fullscreen'),
    GeolocateControl: control('geolocate'),
    AttributionControl: control('attribution'),
  };
}

/** The most recently created map. */
export const lastMap = () => FakeMap.instances.at(-1)!;
