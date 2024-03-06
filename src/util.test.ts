import { SpyInstance, beforeEach, describe, expect, it, vi } from 'vitest';
import * as iconPackManager from './icon-pack-manager';
import {
  getAllOpenedFiles,
  isHexadecimal,
  readFileSync,
  removeIconFromIconPack,
  saveIconToIconPack,
  stringToHex,
} from './util';

describe('readFileSync', () => {
  it('should read file content', async () => {
    const mockFileContent = 'Hello World!';
    const mockFile = new Blob([mockFileContent], { type: 'text/plain' });
    const result = await readFileSync(mockFile as any);
    expect(result).toBe(mockFileContent);
  });
});

describe('getAllOpenedFiles', () => {
  it('should return all opened files', () => {
    const plugin: any = {
      app: {
        workspace: {
          getLeavesOfType: () => [
            {
              view: {
                file: {
                  path: 'file/path',
                },
              },
            },
          ],
        },
      },
    };

    const openedFiles = getAllOpenedFiles(plugin);
    expect(openedFiles).toHaveLength(1);
    expect(openedFiles[0]).toEqual({
      path: 'file/path',
      leaf: {
        view: {
          file: {
            path: 'file/path',
          },
        },
      },
    });
  });
});

describe('saveIconToIconPack', () => {
  let extractIconToIconPack: SpyInstance;

  beforeEach(() => {
    vi.restoreAllMocks();
    extractIconToIconPack = vi.spyOn(iconPackManager, 'extractIconToIconPack');
    extractIconToIconPack.mockImplementationOnce(() => {});
  });

  it('should not save icon to icon pack when svg was not found', () => {
    expect.assertions(2);
    try {
      saveIconToIconPack({} as any, 'IbTest');
    } catch (e) {
      expect(e).not.toBeNull();
    }
    expect(extractIconToIconPack).toBeCalledTimes(0);
  });

  it('should save icon to icon pack', () => {
    const getSvgFromLoadedIcon = vi
      .spyOn(iconPackManager, 'getSvgFromLoadedIcon')
      .mockImplementationOnce(() => '<svg></svg>');
    const getIconPackNameByPrefix = vi
      .spyOn(iconPackManager, 'getIconPackNameByPrefix')
      .mockImplementationOnce(() => '');
    const addIconToIconPack = vi
      .spyOn(iconPackManager, 'addIconToIconPack')
      .mockImplementationOnce((): any => ({ name: 'IbTest' }));

    saveIconToIconPack({} as any, 'IbTest');
    expect(extractIconToIconPack).toBeCalledTimes(1);

    getIconPackNameByPrefix.mockRestore();
    addIconToIconPack.mockRestore();
    getSvgFromLoadedIcon.mockRestore();
  });
});

describe('removeIconFromIconPack', () => {
  let plugin: any;
  let removeIconFromIconPackDirectory: SpyInstance;
  beforeEach(() => {
    vi.restoreAllMocks();
    plugin = {
      getDataPathByValue: (): any => undefined,
    };
    removeIconFromIconPackDirectory = vi
      .spyOn(iconPackManager, 'removeIconFromIconPackDirectory')
      .mockImplementationOnce((): any => {});
  });

  it('should not remove icon from icon pack if there is a duplicated icon', () => {
    plugin.getDataPathByValue = () => 'folder/path';
    removeIconFromIconPack(plugin, 'IbTest');
    expect(removeIconFromIconPackDirectory).toBeCalledTimes(0);
  });

  it('should remove icon from icon pack if there is no duplicated icon', () => {
    const getIconPackNameByPrefix = vi
      .spyOn(iconPackManager, 'getIconPackNameByPrefix')
      .mockImplementationOnce(() => 'IconBrew');

    removeIconFromIconPack(plugin, 'IbTest');
    expect(removeIconFromIconPackDirectory).toBeCalledTimes(1);
    expect(removeIconFromIconPackDirectory).toBeCalledWith(
      plugin,
      'IconBrew',
      'Test',
    );

    getIconPackNameByPrefix.mockRestore();
  });
});

describe('stringToHex', () => {
  it('should handle strings with leading zeros', () => {
    expect(stringToHex('000000')).toBe('#000000');
    expect(stringToHex('00f')).toBe('#00000f');
  });

  it('should handle strings without leading zeros', () => {
    expect(stringToHex('11c0a1')).toBe('#11c0a1');
    expect(stringToHex('f0f0f0')).toBe('#f0f0f0');
  });

  it('should handle mixed-case hexadecimal strings', () => {
    expect(stringToHex('aBc123')).toBe('#aBc123');
    expect(stringToHex('AbCdEf')).toBe('#AbCdEf');
  });

  it('should return original string if it already starts with #', () => {
    expect(stringToHex('#123456')).toBe('#123456');
  });

  it('should handle empty strings', () => {
    expect(stringToHex('')).toBe('#000000');
  });
});

describe('isHexadecimal', () => {
  it('should return true for valid hexadecimal strings', () => {
    expect(isHexadecimal('000000')).toBe(true);
    expect(isHexadecimal('#000000', true)).toBe(true);
    expect(isHexadecimal('00f')).toBe(true);
    expect(isHexadecimal('#00f', true)).toBe(true);
  });

  it('should return false for invalid hexadecimal strings', () => {
    expect(isHexadecimal('0000000')).toBe(false);
    expect(isHexadecimal('#0000000', true)).toBe(false);
    expect(isHexadecimal('00g')).toBe(false);
    expect(isHexadecimal('#00g', true)).toBe(false);
  });
});
