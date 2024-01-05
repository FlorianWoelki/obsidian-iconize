import { SpyInstance, beforeEach, describe, expect, it, vi } from 'vitest';
import * as iconPackManager from './icon-pack-manager';
import {
  getAllOpenedFiles,
  readFileSync,
  removeIconFromIconPack,
  saveIconToIconPack,
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
