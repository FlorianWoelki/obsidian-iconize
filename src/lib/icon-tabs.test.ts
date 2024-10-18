import { it, describe, beforeEach, expect, vi, MockInstance } from 'vitest';
import { DEFAULT_FILE_ICON } from '@app/util';
import iconTabs from './icon-tabs';
import dom from './util/dom';
import customRule from './custom-rule';

describe('getTabLeavesOfFilePath', () => {
  beforeEach(() => {});

  it('should return an array of tab leaves', () => {
    const plugin = {
      app: {
        workspace: {
          getLeavesOfType: () => {
            return [
              {
                view: {
                  file: {
                    path: 'test2',
                  },
                },
              },
              {
                view: {
                  file: {
                    path: 'test',
                  },
                },
              },
              {
                view: {
                  file: {
                    path: 'test',
                  },
                },
              },
            ];
          },
        },
      },
    } as any;
    const leaves = iconTabs.getTabLeavesOfFilePath(plugin, 'test');
    expect(leaves.length).toBe(2);
  });

  it('should return an empty array when no tab leaves are found', () => {
    const plugin = {
      app: {
        workspace: {
          getLeavesOfType: (): any => {
            return [];
          },
        },
      },
    } as any;
    const leaves = iconTabs.getTabLeavesOfFilePath(plugin, 'test');
    expect(leaves.length).toBe(0);
  });
});

describe('add', () => {
  let setIconForNode: MockInstance;
  let plugin: any;
  let file: any;
  beforeEach(() => {
    setIconForNode = vi.spyOn(dom, 'setIconForNode');
    setIconForNode.mockImplementationOnce(() => {});
    plugin = {
      getData: () => {
        return {
          test: 'test',
        };
      },
      getSettings: (): any => {
        return {
          rules: [],
          iconColor: 'purple',
        };
      },
    };
    file = {
      path: 'test',
    };
  });

  it('should only call `dom.setIconForNode` if `options.iconName` is set', async () => {
    const iconContainer = document.createElement('div');
    await iconTabs.add(plugin, '', iconContainer, {
      iconName: 'IbTest',
    });
    expect(iconContainer.style.display).toBe('flex');
    expect(iconContainer.style.margin).toBe('');
    expect(setIconForNode).toHaveBeenCalledWith(
      plugin,
      'IbTest',
      iconContainer,
      { color: 'purple' },
    );
  });

  it('should use icon color `options.iconColor`', async () => {
    const iconContainer = document.createElement('div');
    await iconTabs.add(plugin, '', iconContainer, {
      iconName: 'IbTest',
      iconColor: 'blue',
    });
    expect(setIconForNode).toHaveBeenCalledWith(
      plugin,
      'IbTest',
      iconContainer,
      { color: 'blue' },
    );
  });

  it('should call `dom.setIconForNode` when icon is found in data', async () => {
    const iconContainer = document.createElement('div');
    await iconTabs.add(plugin, file.path, iconContainer);
    expect(iconContainer.style.margin).toBe('');
    expect(setIconForNode).toBeCalledTimes(1);
    expect(setIconForNode).toBeCalledWith(plugin, 'test', iconContainer, {
      color: 'purple',
      shouldApplyAllStyles: true,
    });
  });

  it('should not call `dom.setIconForNode` when icon is not found in data', async () => {
    file.path = 'test2';
    const iconContainer = document.createElement('div');
    await iconTabs.add(plugin, file.path, iconContainer);
    expect(setIconForNode).toBeCalledTimes(0);
  });

  it('should call `dom.setIconForNode` when custom rule is found and applicable', async () => {
    plugin.getData = () => ({});
    const getSortedRules = vi
      .spyOn(customRule, 'getSortedRules')
      .mockImplementationOnce(
        () =>
          [
            {
              for: 'everything',
              icon: 'IbTest',
              order: 0,
              rule: 'test',
            },
          ] as any,
      );
    const isApplicable = vi
      .spyOn(customRule, 'isApplicable')
      .mockImplementationOnce(() => true as any);

    const iconContainer = document.createElement('div');
    await iconTabs.add(plugin, file.path, iconContainer);
    expect(iconContainer.style.margin).toBe('');
    expect(setIconForNode).toBeCalledTimes(1);
    expect(setIconForNode).toBeCalledWith(plugin, 'IbTest', iconContainer, {
      color: undefined,
    });

    getSortedRules.mockRestore();
    isApplicable.mockRestore();
  });

  it('should not call `dom.setIconForNode` when custom rule is found but not applicable', async () => {
    plugin.getData = () => ({});
    const getSortedRules = vi
      .spyOn(customRule, 'getSortedRules')
      .mockImplementationOnce(
        () =>
          [
            {
              for: 'everything',
              icon: 'IbTest',
              order: 0,
              rule: 'test',
            },
          ] as any,
      );
    const isApplicable = vi
      .spyOn(customRule, 'isApplicable')
      .mockImplementationOnce(() => false as any);

    const iconContainer = document.createElement('div');
    await iconTabs.add(plugin, file.path, iconContainer);
    expect(setIconForNode).toBeCalledTimes(0);

    getSortedRules.mockRestore();
    isApplicable.mockRestore();
  });
});

describe('update', () => {
  it('should call `dom.setIconForNode` and set the margin to null', () => {
    const setIconForNode = vi.spyOn(dom, 'setIconForNode');
    setIconForNode.mockImplementationOnce(() => {});

    const iconContainer = document.createElement('div');
    iconTabs.update({} as any, 'test', iconContainer);
    expect(iconContainer.style.margin).toBe('');
    expect(setIconForNode).toHaveBeenCalledWith(
      {} as any,
      'test',
      iconContainer,
    );
    expect(setIconForNode).toBeCalledTimes(1);

    setIconForNode.mockRestore();
  });
});

describe('remove', () => {
  it('should set the display style property to `none` when `replaceWithDefaultIcon` is not set', () => {
    const iconContainer = document.createElement('div');
    iconTabs.remove(iconContainer);
    expect(iconContainer.style.display).toBe('none');
  });

  it('should set the `innerHTML` to the default file icon when `replaceWithDefaultIcon` is set', () => {
    const iconContainer = document.createElement('div');
    iconTabs.remove(iconContainer, { replaceWithDefaultIcon: true });
    expect(iconContainer.innerHTML).toBe(DEFAULT_FILE_ICON);
  });
});
