import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as util from '../../util';
import svg from './svg';
import style from './style';

describe('setMargin', () => {
  it('should set the margin of an element', () => {
    const el = document.createElement('div');
    const margin = { top: 10, right: 15, bottom: 20, left: 25 };
    const modifiedEl = style.setMargin(el, margin);
    expect(modifiedEl.style.margin).toBe('10px 15px 20px 25px');
  });
});

describe('applyAll', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should apply all styles to the icon and container', async () => {
    const setFontSizeSpy = vi.spyOn(svg, 'setFontSize');
    const colorizeSpy = vi.spyOn(svg, 'colorize');

    const plugin = {
      getSettings: () => ({
        fontSize: 16,
        iconColor: 'red',
        extraMargin: { top: 10, right: 15, bottom: 20, left: 25 },
      }),
    };

    const iconString = '<svg></svg>';
    const container = document.createElement('div');

    setFontSizeSpy.mockImplementationOnce(() => iconString);
    colorizeSpy.mockImplementationOnce(() => iconString);

    const result = style.applyAll(plugin as any, iconString, container);

    expect(result).toBe(iconString);
    expect(container.style.color).toBe('red');
    expect(container.style.margin).toBe('10px 15px 20px 25px');
    expect(setFontSizeSpy).toHaveBeenCalledWith(iconString, 16);
    expect(colorizeSpy).toHaveBeenCalledWith(iconString, 'red');
  });

  it('should apply emoji styles when specified icon is an emoji', () => {
    const plugin = {
      getSettings: () => ({
        fontSize: 16,
        iconColor: '#000000',
        extraMargin: { top: 4, right: 4, bottom: 4, left: 4 },
      }),
    };

    const iconString = '😀';
    const container = document.createElement('div');
    const result = style.applyAll(plugin as any, iconString, container);

    expect(result).toBe(iconString);
    expect(container.style.fontSize).toBe('16px');
    expect(container.style.lineHeight).toBe('16px');
  });
});

describe('refreshIconNodes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should refresh icon nodes', () => {
    const getFileItemTitleElSpy = vi.spyOn(util, 'getFileItemTitleEl');
    const applyStyles = vi.fn();

    const plugin = {
      app: {
        workspace: {
          getLeavesOfType: () => [
            { view: { fileItems: { path1: {}, path2: {} } } },
          ],
        },
      },
      getData() {
        return { path1: {}, path2: {} };
      },
      getSettings: () => ({
        fontSize: 16,
        iconColor: '#000000',
        extraMargin: { top: 4, right: 4, bottom: 4, left: 4 },
      }),
    };

    const titleEl = document.createElement('div');
    const iconNode = document.createElement('div');
    iconNode.classList.add('obsidian-icon-folder-icon');
    titleEl.appendChild(iconNode);

    getFileItemTitleElSpy.mockReturnValue(titleEl);

    style.refreshIconNodes(plugin as any, applyStyles);
    expect(applyStyles).toHaveBeenCalledTimes(2);
  });
});
