import { describe, expect, it } from 'vitest';
import {
  barStartOf,
  createDeviceLayout,
  foldOf,
  setupCapacitor,
  type DeviceLayoutSnapshot,
} from '../src/lib/index.js';
import { fakeDeviceLayout, flush, platform, registeredPlugins } from './fakes.js';

const root = document.documentElement;
const variable = (name: string) => root.style.getPropertyValue(name);
const margins = { top: 0, right: 0, bottom: 0, left: 0 };

/** iPhone Duo's cover screen: bars on the right, the camera and status bar reserved above them. */
const closed: DeviceLayoutSnapshot = {
  width: 466,
  height: 678,
  barEdge: 'right',
  regions: [{ kind: 'occlusion', x: 382, y: 0, width: 84, height: 160, margins }],
  hinge: { status: 'closed', angle: 0 },
};

/** The inner screen partly open: a fold down the middle. */
const partlyOpen: DeviceLayoutSnapshot = {
  width: 951,
  height: 669,
  regions: [{ kind: 'division', x: 455, y: 0, width: 41, height: 669, margins }],
  hinge: { status: 'partially-open', angle: 100 },
};

describe('foldOf and barStartOf', () => {
  it('reads the fold as a band across the axis it divides', () => {
    expect(foldOf(partlyOpen)).toEqual({ axis: 'vertical', start: 455, end: 496 });
    expect(foldOf(closed)).toBeNull();
    const sideways = {
      ...partlyOpen,
      regions: [{ kind: 'division' as const, x: 0, y: 300, width: 669, height: 40, margins }],
    };
    expect(foldOf(sideways)).toEqual({ axis: 'horizontal', start: 300, end: 340 });
  });

  it('starts side controls below what the system reserves in their strip', () => {
    expect(barStartOf(closed)).toBe(160);
    // A camera on the other side doesn't push the controls down.
    const elsewhere = {
      ...closed,
      regions: [{ kind: 'occlusion' as const, x: 10, y: 10, width: 60, height: 300, margins }],
    };
    expect(barStartOf(elsewhere)).toBe(0);
    expect(barStartOf(partlyOpen)).toBe(0);
  });
});

describe('createDeviceLayout', () => {
  it('does nothing in a browser', () => {
    const DeviceLayout = fakeDeviceLayout(closed);
    const layout = createDeviceLayout({ DeviceLayout });
    expect(DeviceLayout.getLayout).not.toHaveBeenCalled();
    expect(layout.current).toBeNull();
    layout.destroy();
  });

  it('marks the bar edge and where side controls start', async () => {
    platform.current = 'ios';
    const DeviceLayout = fakeDeviceLayout(closed);
    const layout = createDeviceLayout({ DeviceLayout });
    await flush();
    expect(layout.current).toEqual(closed);
    expect(root).toHaveAttribute('data-bar-edge', 'right');
    expect(root).toHaveAttribute('data-hinge', 'closed');
    expect(variable('--ldt-bar-start')).toBe('160px');
    expect(root).not.toHaveAttribute('data-fold');
    layout.destroy();
  });

  it('follows the device as it opens, and clears what no longer applies', async () => {
    platform.current = 'ios';
    const DeviceLayout = fakeDeviceLayout(closed);
    const layout = createDeviceLayout({ DeviceLayout });
    await flush();
    DeviceLayout.emit('change', partlyOpen);
    expect(root).not.toHaveAttribute('data-bar-edge');
    expect(variable('--ldt-bar-start')).toBe('');
    expect(root).toHaveAttribute('data-fold', 'vertical');
    expect(variable('--ldt-fold-start')).toBe('455px');
    expect(variable('--ldt-fold-end')).toBe('496px');
    expect(root).toHaveAttribute('data-hinge', 'partially-open');
    layout.destroy();
  });

  it('keeps a change that arrives before the first report', async () => {
    platform.current = 'ios';
    const DeviceLayout = fakeDeviceLayout(closed);
    const layout = createDeviceLayout({ DeviceLayout });
    DeviceLayout.emit('change', partlyOpen);
    await flush();
    expect(layout.current).toEqual(partlyOpen);
    expect(root).toHaveAttribute('data-fold', 'vertical');
    layout.destroy();
  });

  it('removes its listener, attributes and variables when destroyed', async () => {
    platform.current = 'ios';
    const DeviceLayout = fakeDeviceLayout(closed);
    const layout = createDeviceLayout({ DeviceLayout });
    await flush();
    layout.destroy();
    await flush();
    expect(DeviceLayout.count('change')).toBe(0);
    expect(root).not.toHaveAttribute('data-bar-edge');
    expect(root).not.toHaveAttribute('data-hinge');
    expect(variable('--ldt-bar-start')).toBe('');
  });

  it('leaves the page alone when the app was built without the native plugin', async () => {
    platform.current = 'ios';
    const layout = createDeviceLayout();
    await flush();
    expect(layout.current).toBeNull();
    expect(root).not.toHaveAttribute('data-bar-edge');
    layout.destroy();
  });

  it('only runs on iOS', async () => {
    platform.current = 'android';
    const DeviceLayout = fakeDeviceLayout(closed);
    const layout = createDeviceLayout({ DeviceLayout });
    await flush();
    expect(DeviceLayout.getLayout).not.toHaveBeenCalled();
    layout.destroy();
  });
});

describe('setupCapacitor', () => {
  it('follows the device layout with the bundled plugin unless turned off', async () => {
    platform.current = 'ios';
    registeredPlugins.set('DeviceLayout', fakeDeviceLayout(closed));
    const native = setupCapacitor({ plugins: {} });
    await flush();
    expect(native.deviceLayout?.current).toEqual(closed);
    expect(root).toHaveAttribute('data-bar-edge', 'right');
    native.destroy();
    expect(root).not.toHaveAttribute('data-bar-edge');

    const off = setupCapacitor({ plugins: {}, deviceLayout: false });
    expect(off.deviceLayout).toBeUndefined();
    off.destroy();
  });
});
