import { vi, it, describe, beforeEach, expect, SpyInstance } from 'vitest';
import { Plugin, TAbstractFile } from 'obsidian';
import dom from './util/dom';
import { CustomRule } from '../settings/data';
import customRule, { CustomRuleFileType } from './custom-rule';
import config from '../config';

describe('doesMatchFileType', () => {
  let rule: CustomRule;
  let fileType: CustomRuleFileType;
  beforeEach(() => {
    rule = {
      for: 'everything',
      rule: 'test',
      icon: 'test',
      order: 0,
    };
    fileType = 'file';
  });

  it('should return `true` if the rule matches the file type', () => {
    expect(customRule.doesMatchFileType(rule, fileType)).toBe(true);
    rule.for = 'files';
    expect(customRule.doesMatchFileType(rule, fileType)).toBe(true);
    rule.for = 'folders';
    fileType = 'folder';
    expect(customRule.doesMatchFileType(rule, fileType)).toBe(true);
  });

  it('should return `false` if the rule does not match the file type', () => {
    rule.for = 'folders';
    expect(customRule.doesMatchFileType(rule, fileType)).toBe(false);
    rule.for = 'files';
    fileType = 'folder';
    expect(customRule.doesMatchFileType(rule, fileType)).toBe(false);
  });
});

describe('isApplicable', () => {
  let plugin: Plugin;
  let rule: CustomRule;
  let file: TAbstractFile;

  beforeEach(() => {
    plugin = {
      app: {
        vault: {
          adapter: {
            stat: (): any => ({
              type: 'file',
            }),
          },
        },
      },
    } as any;
    rule = {
      for: 'everything',
      rule: 'test',
      icon: 'test',
      order: 0,
    };
    file = {
      path: 'test',
      name: 'test',
    } as any;
  });

  it('should return `false` if metadata is not available', async () => {
    plugin.app.vault.adapter.stat = (): any => null;
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(false);
  });

  it('should return `false` if the rule does not match with the name', async () => {
    rule.rule = 'test1';
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(false);
    rule.rule = '.*-test';
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(false);
  });

  it('should return `false` if the rule does not match the type', async () => {
    rule.for = 'folders';
    rule.rule = 'test';
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(false);
    rule.rule = 'test.*';
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(false);
  });

  it('should return `true` if the rule matches the name and type', async () => {
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(true);
    rule.rule = 'test.*';
    expect(await customRule.isApplicable(plugin, rule, file)).toBe(true);
  });
});

describe('removeFromAllFiles', () => {
  let removeIconInNode: SpyInstance;
  let plugin: any;
  let rule: CustomRule;

  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    removeIconInNode = vi.spyOn(dom, 'removeIconInNode');
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    removeIconInNode.mockImplementationOnce(() => {});
    rule = {
      for: 'everything',
      rule: 'test',
      icon: 'IbTest',
      order: 0,
    };
    plugin = {
      app: {
        vault: {
          adapter: {
            stat: () => ({ type: 'file' }),
          },
        },
      },
    } as any;
  });

  it('should call `removeIconInNode` when nodes are found and match the custom rule', async () => {
    const node = document.createElement('div');
    node.setAttribute('data-path', 'test');
    const icon = document.createElement('div');
    icon.setAttribute(config.ICON_ATTRIBUTE_NAME, 'IbTest');
    icon.classList.add('iconize-icon');
    node.appendChild(icon);
    document.body.appendChild(node);

    await customRule.removeFromAllFiles(plugin, rule);
    expect(removeIconInNode).toBeCalledTimes(1);
  });

  it('should not call `removeIconInNode` when nodes are found but do not match the custom rule', async () => {
    const node = document.createElement('div');
    node.setAttribute('data-path', 'foo');
    const icon = document.createElement('div');
    icon.setAttribute(config.ICON_ATTRIBUTE_NAME, 'IbTest');
    icon.classList.add('iconize-icon');
    node.appendChild(icon);
    document.body.appendChild(node);

    await customRule.removeFromAllFiles(plugin, rule);
    expect(removeIconInNode).toBeCalledTimes(0);
  });

  it('should not call `removeIconInNode` when nodes are found but do not match the custom rule `for` property', async () => {
    rule.for = 'folders';
    const node = document.createElement('div');
    node.setAttribute('data-path', 'test');
    const icon = document.createElement('div');
    icon.setAttribute(config.ICON_ATTRIBUTE_NAME, 'IbTest');
    icon.classList.add('iconize-icon');
    node.appendChild(icon);
    document.body.appendChild(node);

    await customRule.removeFromAllFiles(plugin, rule);
    expect(removeIconInNode).toBeCalledTimes(0);
  });

  it('should not call `removeIconInNode` when `data-path` attribute in parent is not found', async () => {
    const icon = document.createElement('div');
    icon.setAttribute(config.ICON_ATTRIBUTE_NAME, 'IbTest');
    icon.classList.add('iconize-icon');
    document.body.appendChild(icon);

    await customRule.removeFromAllFiles(plugin, rule);
    expect(removeIconInNode).toBeCalledTimes(0);
  });
});

describe('getSortedRules', () => {
  it('should return the rules sorted by order', () => {
    const rules: CustomRule[] = [
      {
        for: 'everything',
        rule: 'test',
        icon: 'test',
        order: 2,
      },
      {
        for: 'everything',
        rule: 'test',
        icon: 'test',
        order: 0,
      },
      {
        for: 'everything',
        rule: 'test',
        icon: 'test',
        order: 1,
      },
    ];
    const plugin = {
      getSettings: () => ({
        rules,
      }),
    } as any;
    const sortedRules = customRule.getSortedRules(plugin);
    expect(sortedRules[0].order).toBe(0);
    expect(sortedRules[1].order).toBe(1);
    expect(sortedRules[2].order).toBe(2);
  });
});

describe('add', () => {
  let createIconNode: SpyInstance;
  let plugin: any;
  let rule: CustomRule;
  let file: any;
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    createIconNode = vi.spyOn(dom, 'createIconNode');
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    createIconNode.mockImplementationOnce(() => {});
    plugin = {
      app: {
        vault: {
          adapter: {
            stat: () => ({ type: 'file' }),
          },
        },
      },
      getIconNameFromPath: () => false,
    };
    rule = {
      for: 'everything',
      rule: 'test',
      icon: 'test',
      order: 0,
    };
    file = {
      path: 'test',
      name: 'test',
    };
  });

  it('should add the icon to the node', async () => {
    const node = document.createElement('div');
    node.setAttribute('data-path', 'test');
    document.body.appendChild(node);

    const result = await customRule.add(plugin, rule, file);
    expect(createIconNode).toBeCalledTimes(1);
    expect(result).toBe(true);
  });

  it('should not add the icon to the node if the node already has an icon', async () => {
    plugin.getIconNameFromPath = () => 'IbTest';
    const result = await customRule.add(plugin, rule, file);
    expect(createIconNode).toBeCalledTimes(0);
    expect(result).toBe(false);
  });

  it('should not add the icon to the node if the node does not match the rule', async () => {
    rule.rule = 'test1';
    const result = await customRule.add(plugin, rule, file);
    expect(createIconNode).toBeCalledTimes(0);
    expect(result).toBe(false);
  });
});

describe('doesMatchPath', () => {
  let rule: CustomRule;
  beforeEach(() => {
    rule = {
      for: 'everything',
      rule: 'test',
      icon: 'test',
      order: 0,
    };
  });

  it('should return `true` if the rule matches the path', () => {
    expect(customRule.doesMatchPath(rule, 'test')).toBe(true);
    rule.rule = 'test.*';
    expect(customRule.doesMatchPath(rule, 'test')).toBe(true);
  });

  it('should return `false` if the rule does not match the path', () => {
    rule.rule = 'test1';
    expect(customRule.doesMatchPath(rule, 'test')).toBe(false);
    rule.rule = '.*-test';
    expect(customRule.doesMatchPath(rule, 'test')).toBe(false);
  });
});

describe('getFileItems', () => {
  it('should return the file items which are applicable to the custom rule', async () => {
    const plugin = {
      app: {
        vault: {
          adapter: {
            stat: () => ({ type: 'file' }),
          },
        },
      },
      getRegisteredFileExplorers: () => [
        {
          fileItems: [
            {
              file: {
                path: 'test',
                name: 'test',
              },
            },
            {
              file: {
                path: 'foo',
                name: 'foo',
              },
            },
            {
              file: {
                path: 'test1',
                name: 'test1',
              },
            },
          ],
        },
      ],
    } as any;
    const rule: CustomRule = {
      for: 'everything',
      rule: 'test',
      icon: 'test',
      order: 0,
    };
    const result = await customRule.getFileItems(plugin, rule);
    expect(result.length).toBe(2);
  });
});
