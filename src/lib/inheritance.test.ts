import {
  Mock,
  SpyInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import inheritance from './inheritance';
import dom from './util/dom';

describe.skip('add', () => {
  let plugin: any;
  let setIconForNode: SpyInstance;
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    plugin = {
      getData: () => ({
        'folder/path': {
          inheritanceIcon: 'IbTest',
        },
      }),
      getRegisteredFileExplorers: () => [
        {
          fileItems: {
            'folder/path/file': {
              selfEl: document.createElement('div'),
              file: {
                path: 'folder/path/file',
                parent: {
                  path: 'folder/path',
                },
              },
            },
          },
        },
      ],
    };
    setIconForNode = vi.spyOn(dom, 'setIconForNode');
    setIconForNode.mockImplementationOnce(() => {});
  });

  it('should not add the icon when the folder path does not exist in the data or is not an object', () => {
    inheritance.add(plugin, 'test', 'IbTest');
    expect(setIconForNode).toBeCalledTimes(0);
  });

  it('should add the icon when it is a correct file in the folder path', () => {
    inheritance.add(plugin, 'folder/path', 'IbTest');
    expect(setIconForNode).toBeCalledTimes(1);
  });

  it('should not add the icon when the file item does have an icon', () => {
    plugin.getData = () => ({
      'folder/path': {
        inheritanceIcon: 'IbTest',
      },
      'folder/path/file': 'IbTest',
    });
    inheritance.add(plugin, 'folder/path', 'IbTest');
    expect(setIconForNode).toBeCalledTimes(0);
  });

  it('should not add the icon when the file is not in the folder', () => {
    inheritance.add(plugin, 'abc/path', 'IbTest');
    expect(setIconForNode).toBeCalledTimes(0);
  });

  it('should not add the icon when the file item is a folder', () => {
    plugin.getRegisteredFileExplorers = (): any => [
      {
        fileItems: {
          'folder/path/file': {
            selfEl: document.createElement('div'),
            file: {
              path: 'folder/path/file',
              parent: {
                path: 'folder/path',
              },
              children: [],
            },
          },
        },
      },
    ];
    inheritance.add(plugin, 'folder/path', 'IbTest');
    expect(setIconForNode).toBeCalledTimes(0);
  });

  it('should remove the icon when the file item has an existing icon set in the container', () => {
    const doesElementHasIconNode = vi
      .spyOn(dom, 'doesElementHasIconNode')
      .mockImplementationOnce(() => true);
    const removeIconInNode = vi
      .spyOn(dom, 'removeIconInNode')
      .mockImplementationOnce(() => {});

    inheritance.add(plugin, 'folder/path', 'IbTest');
    expect(removeIconInNode).toBeCalledTimes(1);
    expect(setIconForNode).toBeCalledTimes(1);

    doesElementHasIconNode.mockRestore();
    removeIconInNode.mockRestore();
  });

  it('should set an icon for `options.file` when it is specified', () => {
    inheritance.add(plugin, 'folder/path', 'IbTest', {
      file: {
        path: 'folder/path/file',
        parent: {
          path: 'folder/path',
        },
      } as any,
    });
    expect(setIconForNode).toBeCalledTimes(1);
  });
});

describe.skip('remove', () => {
  let plugin: any = {
    getData: () => ({
      settings: {},
      file: 'IbTest',
      'folder/path': {
        icon: 'IbTest',
      },
    }),
  };
  let removeIconInPath: SpyInstance;
  let onRemove: Mock;
  beforeEach(() => {
    removeIconInPath = vi.spyOn(dom, 'removeIconInPath');
    removeIconInPath.mockImplementationOnce(() => {});
    onRemove = vi.fn();
  });

  it('should call `dom.removeIconInPath` and `onRemove` when the folder path does not exist in the data', () => {
    plugin.app = {
      vault: {
        getAllLoadedFiles: () => [
          {
            path: 'folder/path/file',
            parent: {
              path: 'folder/path',
            },
          },
        ],
      },
    };
    inheritance.remove(plugin, 'folder/path', { onRemove });
    expect(removeIconInPath).toBeCalledTimes(1);
    expect(removeIconInPath).toBeCalledWith('folder/path/file');
    expect(onRemove).toBeCalledTimes(1);
    expect(onRemove).toBeCalledWith({
      path: 'folder/path/file',
      parent: {
        path: 'folder/path',
      },
    });
  });

  it('should not call `dom.removeIconInPath` and `onRemove` when the folder path does still exist in the data', () => {
    const originalData = plugin.getData();
    plugin = {
      getData: () => ({
        ...originalData,
        'folder/path/file': 'IbTest',
      }),
      app: {
        vault: {
          getAllLoadedFiles: () => [
            {
              path: 'folder/path/file',
              parent: {
                path: 'folder/path',
              },
            },
          ],
        },
      },
    };
    inheritance.remove(plugin, 'folder/path', { onRemove });
    expect(removeIconInPath).toBeCalledTimes(0);
    expect(onRemove).toBeCalledTimes(0);
  });

  it('should not call `dom.removeIconInPath` and `onRemove` when the folder path does not exist in the data', () => {
    inheritance.remove(plugin, 'test', { onRemove });
    expect(removeIconInPath).toBeCalledTimes(0);
    expect(onRemove).toBeCalledTimes(0);
  });

  it('should not call `dom.removeIconInPath` and `onRemove` when the folder path is not an object', () => {
    inheritance.remove(plugin, 'file', { onRemove });
    expect(removeIconInPath).toBeCalledTimes(0);
    expect(onRemove).toBeCalledTimes(0);
  });
});

describe.skip('getFolders', () => {
  let plugin: any;
  beforeEach(() => {
    plugin = {
      getData: () => ({}),
    };
  });

  it('should return an object with folder paths as keys and folder icons as values', () => {
    plugin.getData = () => {
      return {
        settings: {},
        'folder/path': {
          icon: 'IbTest',
        },
      };
    };
    const folders = inheritance.getFolders(plugin);
    expect(folders).toEqual({
      'folder/path': {
        icon: 'IbTest',
      },
    });
  });

  it('should return an empty object when no folders are registered', () => {
    const folders = inheritance.getFolders(plugin);
    expect(folders).toEqual({});
  });
});

describe.skip('getFiles', () => {
  const plugin: any = {
    app: {
      vault: {
        getAllLoadedFiles: () => {
          return [
            {
              path: 'file/path',
              parent: {
                path: 'folder/path',
              },
            },
          ];
        },
      },
    },
  };

  it('should return an array of files which include the specified folder path', () => {
    const files = inheritance.getFiles(plugin, 'path');
    expect(files).toHaveLength(1);
    expect(files[0]).toEqual({
      path: 'file/path',
      parent: {
        path: 'folder/path',
      },
    });
  });

  it('should return an empty array when no files are found', () => {
    const files = inheritance.getFiles(plugin, 'test');
    expect(files).toHaveLength(0);
  });
});

describe.skip('getByPath', () => {
  const plugin: any = {
    getData: () => ({
      settings: {},
      'folder/path': {
        icon: 'IbTest',
      },
    }),
  };

  it('should return the folder icon when the path is found', () => {
    const folderIcon = inheritance.getByPath(plugin, 'folder/path');
    expect(folderIcon).toEqual({
      icon: 'IbTest',
    });
  });

  it('should return `undefined` when the path is not found', () => {
    const folderIcon = inheritance.getByPath(plugin, 'test');
    expect(folderIcon).toBe(undefined);
  });
});

describe.skip('getFolderPathByFilePath', () => {
  const plugin: any = {
    getData: () => ({
      settings: {},
      'folder/path': {
        icon: 'IbTest',
      },
    }),
  };

  it('should return the folder path when the file path is found', () => {
    const folderPath = inheritance.getFolderPathByFilePath(
      plugin,
      'folder/path',
    );
    expect(folderPath).toBe('folder/path');
  });

  it('should return `undefined` when the file path is not found', () => {
    const folderPath = inheritance.getFolderPathByFilePath(plugin, 'test');
    expect(folderPath).toBe(undefined);
  });
});

describe.skip('doesExistInPath', () => {
  let plugin: any;
  beforeEach(() => {
    plugin = {
      getData: () => ({}),
    };
  });

  it('should return `true` when the path exists', () => {
    plugin = {
      getData: () => {
        return {
          settings: {},
          'folder/path': {
            icon: 'IbTest',
          },
        };
      },
    };
    const doesExist = inheritance.doesExistInPath(plugin, 'folder/path');
    expect(doesExist).toBe(true);
  });

  it('should return `false` when the path does not exist', () => {
    const doesExist = inheritance.doesExistInPath(plugin, 'path');
    expect(doesExist).toBe(false);
  });
});
