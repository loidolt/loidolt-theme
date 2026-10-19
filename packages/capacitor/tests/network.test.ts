import { describe, expect, it } from 'vitest';
import { createNetworkStatus } from '../src/lib/index.js';
import { fakeNetwork, fakeToaster, flush, platform } from './fakes.js';

describe('createNetworkStatus', () => {
  it('reads the native status and follows changes', async () => {
    platform.current = 'ios';
    const Network = fakeNetwork(true);
    const status = createNetworkStatus({ Network });
    await flush();
    expect(status.connected).toBe(true);
    expect(status.type).toBe('wifi');
    Network.emit('networkStatusChange', { connected: false, connectionType: 'none' });
    expect(status.connected).toBe(false);
    expect(status.type).toBe('none');
    status.destroy();
    await flush();
    expect(Network.count('networkStatusChange')).toBe(0);
  });

  it('keeps an offline toast up until the connection returns', async () => {
    platform.current = 'android';
    const Network = fakeNetwork(true);
    const toaster = fakeToaster();
    const status = createNetworkStatus({ Network, toaster, labels: { online: 'Reconnected' } });
    await flush();
    Network.emit('networkStatusChange', { connected: false, connectionType: 'none' });
    expect(toaster.warning).toHaveBeenCalledWith('You are offline', {
      description: 'Changes will sync when the connection returns.',
      duration: 0,
    });
    Network.emit('networkStatusChange', { connected: false, connectionType: 'none' });
    expect(toaster.warning).toHaveBeenCalledOnce();
    Network.emit('networkStatusChange', { connected: true, connectionType: 'cellular' });
    expect(toaster.dismiss).toHaveBeenCalledWith('toast-1');
    expect(toaster.success).toHaveBeenCalledWith('Reconnected', { duration: 4000 });
    status.destroy();
  });

  it('starts offline when the device is, and survives a failing plugin', async () => {
    platform.current = 'ios';
    const offline = createNetworkStatus({ Network: fakeNetwork(false) });
    await flush();
    expect(offline.connected).toBe(false);
    offline.destroy();

    const Network = fakeNetwork();
    Network.getStatus.mockRejectedValue(new Error('no native plugin'));
    const status = createNetworkStatus({ Network });
    await flush();
    expect(status.connected).toBe(true);
    status.destroy();
  });

  it('follows the browser events outside a native shell', () => {
    const Network = fakeNetwork();
    const toaster = fakeToaster();
    const status = createNetworkStatus({ Network, toaster });
    expect(Network.getStatus).not.toHaveBeenCalled();
    window.dispatchEvent(new Event('offline'));
    expect(status.connected).toBe(false);
    window.dispatchEvent(new Event('online'));
    expect(status.connected).toBe(true);
    expect(toaster.success).toHaveBeenCalledOnce();
    status.destroy();
    window.dispatchEvent(new Event('offline'));
    expect(status.connected).toBe(true);
  });
});
