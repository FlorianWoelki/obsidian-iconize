import { vi, it, expect, describe, afterEach } from 'vitest';
import { downloadZipFile, getFileFromJSZipFile, readZipFile } from './zip-util';
import JSZip from 'jszip';

const zipUrl = 'http://example.com/zip-file.zip';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadZipFile', () => {
  it('should download a zip file and return an ArrayBuffer', async () => {
    vi.mock('obsidian', () => ({
      requestUrl: () => ({
        arrayBuffer: new ArrayBuffer(8),
      }),
    }));

    const result = await downloadZipFile(zipUrl);
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(8);
  });
});

describe('readZipFile', () => {
  it('should read a zip file and return its files', async () => {
    const spy = vi.spyOn(JSZip, 'loadAsync');
    spy.mockImplementationOnce(
      () =>
        ({
          files: {
            'file1.svg': {
              name: 'file1.svg',
              dir: false,
            },
            'file2.svg': {
              name: 'file2.svg',
              dir: false,
            },
            'file3.svg': {
              name: 'file3.svg',
              dir: false,
            },
          },
        }) as any,
    );

    const arrayBuffer = new ArrayBuffer(8);
    const files = await readZipFile(arrayBuffer);
    expect(files).toBeInstanceOf(Array);
  });

  it('should filter files by `extraPath`', async () => {
    const spy = vi.spyOn(JSZip, 'loadAsync');
    spy.mockImplementationOnce(
      () =>
        ({
          files: {
            'extra-path/file1.svg': {
              name: 'extra-path/file1.svg',
              dir: false,
            },
            'extra-path/file2.svg': {
              name: 'extra-path/file2.svg',
              dir: false,
            },
            'extra-path/file3.svg': {
              name: 'extra-path/file3.svg',
              dir: false,
            },
          },
        }) as any,
    );

    const arrayBuffer = new ArrayBuffer(8);
    const files = await readZipFile(arrayBuffer, 'extra-path/');
    expect(files).toBeInstanceOf(Array);
  });

  it('should reject if no file are found', async () => {
    const spy = vi.spyOn(JSZip, 'loadAsync');
    spy.mockImplementationOnce(
      () =>
        ({
          files: {},
        }) as any,
    );

    const bytes = new ArrayBuffer(0);
    await expect(readZipFile(bytes)).rejects.toBe('No file was found');
  });
});

describe('getFileFromJSZipFile', () => {
  it('should transform a JSZip file into a File object', async () => {
    const file: any = {
      name: 'file.svg',
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      async: () => {},
    };

    const result = await getFileFromJSZipFile(file);
    expect(result).toBeInstanceOf(File);
    expect(result.name).toBe('file.svg');
  });
});
