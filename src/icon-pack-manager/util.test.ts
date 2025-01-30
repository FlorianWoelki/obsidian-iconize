import { it, describe, expect, vi } from 'vitest';
import {
  generateIcon,
  getNormalizedName,
  getSvgFromLoadedIcon,
  nextIdentifier,
} from './util';
import IconizePlugin from '@app/main';
import { IconPack } from './icon-pack';

describe('getNormalizedName', () => {
  it('should return a string with all words capitalized and no spaces or underscores', () => {
    const input = 'this is a test_name';
    const expectedOutput = 'ThisIsATestName';
    expect(getNormalizedName(input)).toEqual(expectedOutput);
  });

  it('should handle input with only one word', () => {
    const input = 'test';
    const expectedOutput = 'Test';
    expect(getNormalizedName(input)).toEqual(expectedOutput);
  });

  it('should handle input with spaces and underscores', () => {
    const input = 'this_is a_test name';
    const expectedOutput = 'ThisIsATestName';
    expect(getNormalizedName(input)).toEqual(expectedOutput);
  });

  it('should handle input with spaces and hyphens', () => {
    const input = 'this-is a-test-name';
    const expectedOutput = 'ThisIsATestName';
    expect(getNormalizedName(input)).toEqual(expectedOutput);
  });
});

describe('nextIdentifier', () => {
  it('should find first uppercase letter or number', () => {
    expect(nextIdentifier('aBcDef')).toBe(1);
    expect(nextIdentifier('a1bcDef')).toBe(1);
    expect(nextIdentifier('aBc123')).toBe(1);
  });

  it('should return 0 when no match found', () => {
    expect(nextIdentifier('abcdef')).toBe(0);
  });

  it('should handle empty string', () => {
    expect(nextIdentifier('')).toBe(0);
  });
});

describe('getSvgFromLoadedIcon', () => {
  const mockPlugin = {
    getIconPackManager: vi.fn(() => ({
      getPreloadedIcons: vi.fn(() => [
        { prefix: 'fa', name: 'user', svgElement: '<svg>preloaded</svg>' },
      ]),
      getIconPacks: vi.fn(() => [
        {
          getIcons: vi.fn(() => [
            {
              prefix: 'md',
              name: 'settings',
              svgElement: '<svg>material</svg>',
            },
          ]),
        },
      ]),
    })),
  } as unknown as IconizePlugin;

  it('should find preloaded icon', () => {
    const result = getSvgFromLoadedIcon(mockPlugin, 'fa', 'user');
    expect(result).toBe('<svg>preloaded</svg>');
  });

  it('should search icon packs when not preloaded', () => {
    const result = getSvgFromLoadedIcon(mockPlugin, 'md', 'settings');
    expect(result).toBe('<svg>material</svg>');
  });

  it('should return empty string when not found', () => {
    const result = getSvgFromLoadedIcon(mockPlugin, 'none', 'missing');
    expect(result).toBe('');
  });
});

describe('generateIcon', () => {
  const mockIconPack = {
    getPrefix: () => 'fa',
    getName: () => 'font-awesome',
  } as IconPack;

  it('should create valid icon structure', () => {
    const result = generateIcon(
      mockIconPack,
      'test',
      '<svg viewBox="0 0 24 24"><path/></svg>',
    );

    expect(result).toEqual({
      name: 'Test',
      prefix: 'fa',
      iconPackName: 'font-awesome',
      displayName: 'test',
      filename: 'test',
      svgContent: '<path/>',
      svgViewbox: 'viewBox="0 0 24 24"',
      svgElement: expect.any(String),
    });
  });

  it('should handle SVG normalization', () => {
    const result = generateIcon(
      mockIconPack,
      'test',
      `
      <svg
        viewBox="0 0 24 24"
        class="test"
      >
        <path />
      </svg>
    `,
    );

    expect(result?.svgContent).toBe('<path />');
    expect(result?.svgViewbox).toBe('viewBox="0 0 24 24"');
  });
});
