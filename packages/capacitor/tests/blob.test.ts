import { afterEach, describe, expect, it, vi } from 'vitest';
import { blobToBase64, downloadBlob, REVOKE_AFTER, safeFileName } from '../src/lib/blob.js';

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('downloadBlob', () => {
  it('clicks a temporary download link and revokes its URL later', () => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    expect(downloadBlob(new Blob(['x']), 'a.txt')).toBe(true);
    const anchor = click.mock.instances[0] as unknown as HTMLAnchorElement;
    expect(anchor.download).toBe('a.txt');
    expect(anchor.isConnected).toBe(false);
    vi.advanceTimersByTime(REVOKE_AFTER - 1);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });

  it('reports false where object URLs are missing', () => {
    const original = URL.createObjectURL;
    URL.createObjectURL = undefined as unknown as typeof URL.createObjectURL;
    expect(downloadBlob(new Blob(['x']), 'a.txt')).toBe(false);
    URL.createObjectURL = original;
  });
});

describe('blobToBase64', () => {
  it('drops the data URL prefix', async () => {
    expect(await blobToBase64(new Blob(['hello'], { type: 'text/plain' }))).toBe(btoa('hello'));
  });

  it('rejects when the read fails', async () => {
    vi.spyOn(FileReader.prototype, 'readAsDataURL').mockImplementation(function (this: FileReader) {
      this.onerror?.(new ProgressEvent('error') as ProgressEvent<FileReader>);
    });
    await expect(blobToBase64(new Blob(['x']))).rejects.toThrow();
  });
});

describe('safeFileName', () => {
  it('keeps a name to one path segment', () => {
    expect(safeFileName('report.pdf')).toBe('report.pdf');
    expect(safeFileName('../../etc/passwd')).toBe('-..-etc-passwd');
    expect(safeFileName('a:b*c?.txt')).toBe('a-b-c-.txt');
    expect(safeFileName('  .hidden')).toBe('hidden');
    expect(safeFileName('...', 'download')).toBe('download');
  });
});
