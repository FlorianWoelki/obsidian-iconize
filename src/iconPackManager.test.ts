import { it, describe, expect, beforeEach, vi } from 'vitest';
import * as iconPackManager from './iconPackManager';

describe('getSvgFromLoadedIcon', () => {
  it('should return svg from loaded icon', () => {
    iconPackManager.setPreloadedIcons([
      {
        prefix: 'Ib',
        name: 'Test',
        svgElement: '<svg></svg>',
      },
    ] as any);
    const svg = iconPackManager.getSvgFromLoadedIcon('Ib', 'Test');
    expect(svg).toBe('<svg></svg>');
  });

  it('should search for icon in all loaded icon packs if icon in preloaded icons is not found', () => {
    iconPackManager.setPreloadedIcons([]);
    iconPackManager.setIconPacks([
      {
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Test',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
    const svg = iconPackManager.getSvgFromLoadedIcon('Ib', 'Test');
    expect(svg).toBe('<svg></svg>');
  });

  it('should get icon from icon pack which does not has a normalized name', () => {
    iconPackManager.setPreloadedIcons([]);
    iconPackManager.setIconPacks([
      {
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Hello-World',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
    const svg = iconPackManager.getSvgFromLoadedIcon('Ib', 'HelloWorld');
    expect(svg).toBe('<svg></svg>');
  });
});

describe('getIconFromIconPack', () => {
  it('should return icon from icon pack', () => {
    iconPackManager.setIconPacks([
      {
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Test',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
    const icon = iconPackManager.getIconFromIconPack('IconBrew', 'Test');
    expect(icon).toEqual({
      prefix: 'Ib',
      name: 'Test',
      svgElement: '<svg></svg>',
    });
  });

  it('should return icon from icon pack which does not has a normalized name in the icon pack', () => {
    iconPackManager.setIconPacks([
      {
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Hello-World',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
    const icon = iconPackManager.getIconFromIconPack('IconBrew', 'HelloWorld');
    expect(icon).toEqual({
      prefix: 'Ib',
      name: 'Hello-World',
      svgElement: '<svg></svg>',
    });
  });

  it('should return `undefined` when icon pack is not found', () => {
    iconPackManager.setIconPacks([]);
    expect(
      iconPackManager.getIconFromIconPack('IconBrew', 'Test'),
    ).toBeUndefined();
  });
});

describe('doesIconExists', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    iconPackManager.setIconPacks([
      {
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Test',
            svgElement: '<svg></svg>',
          },
          {
            prefix: 'Ib',
            name: 'Test2',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
  });

  it('should return `true` if icon exists in loaded icon names and does not include a prefix', () => {
    expect(iconPackManager.doesIconExists('Test')).toBe(true);
  });

  it('should return `true` if icon exists in loaded icon names and includes a prefix', () => {
    expect(iconPackManager.doesIconExists('IbTest2')).toBe(true);
  });

  it('should return `false` if icon does not exist in loaded icon names', () => {
    expect(iconPackManager.doesIconExists('Test3')).toBe(false);
  });
});

describe('createIconPackPrefix', () => {
  it('should return icon pack prefix with uppercase first letter', () => {
    expect(iconPackManager.createIconPackPrefix('iconbrew')).toBe('Ic');
  });

  it('should return icon pack prefix which is splitted by `-` with uppercase first letter of each word', () => {
    expect(iconPackManager.createIconPackPrefix('icon-brew')).toBe('Ib');
  });
});

describe('getNormalizedName', () => {
  it('should return a string with all words capitalized and no spaces or underscores', () => {
    const input = 'this is a test_name';
    const expectedOutput = 'ThisIsATestName';
    expect(iconPackManager.getNormalizedName(input)).toEqual(expectedOutput);
  });

  it('should handle input with only one word', () => {
    const input = 'test';
    const expectedOutput = 'Test';
    expect(iconPackManager.getNormalizedName(input)).toEqual(expectedOutput);
  });

  it('should handle input with spaces and underscores', () => {
    const input = 'this_is a_test name';
    const expectedOutput = 'ThisIsATestName';
    expect(iconPackManager.getNormalizedName(input)).toEqual(expectedOutput);
  });

  it('should handle input with spaces and hyphens', () => {
    const input = 'this-is a-test-name';
    const expectedOutput = 'ThisIsATestName';
    expect(iconPackManager.getNormalizedName(input)).toEqual(expectedOutput);
  });
});

describe('removeIconFromIconPackDirectory', () => {
  let plugin: any;
  beforeEach(() => {
    plugin = {
      app: {
        vault: {
          adapter: {
            rmdir: vi.fn(),
          },
        },
      },
    };
  });

  it('should remove icon from icon pack directory', () => {
    iconPackManager.setIconPacks([
      {
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Test',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
    iconPackManager.removeIconFromIconPackDirectory(plugin, 'IconBrew', 'test');
    expect(plugin.app.vault.adapter.rmdir).toHaveBeenCalledTimes(1);
  });

  it('should not remove icon from custom icon pack directory', () => {
    iconPackManager.setIconPacks([
      {
        custom: true,
        prefix: 'Ib',
        name: 'IconBrew',
        icons: [
          {
            prefix: 'Ib',
            name: 'Test',
            svgElement: '<svg></svg>',
          },
        ],
      },
    ] as any);
    iconPackManager.removeIconFromIconPackDirectory(plugin, 'IconBrew', 'test');
    expect(plugin.app.vault.adapter.rmdir).toHaveBeenCalledTimes(0);
  });
});
