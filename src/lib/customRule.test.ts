import { vi, it, describe, beforeEach, expect, SpyInstance } from 'vitest';
import { Plugin, TAbstractFile } from 'obsidian';
import dom from './util/dom';
import { CustomRule } from '../settings/data';
import customRule, { CustomRuleFileType } from './customRule';
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
    icon.classList.add('obsidian-icon-folder-icon');
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
    icon.classList.add('obsidian-icon-folder-icon');
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
    icon.classList.add('obsidian-icon-folder-icon');
    node.appendChild(icon);
    document.body.appendChild(node);

    await customRule.removeFromAllFiles(plugin, rule);
    expect(removeIconInNode).toBeCalledTimes(0);
  });

  it('should not call `removeIconInNode` when `data-path` attribute in parent is not found', async () => {
    const icon = document.createElement('div');
    icon.setAttribute(config.ICON_ATTRIBUTE_NAME, 'IbTest');
    icon.classList.add('obsidian-icon-folder-icon');
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
