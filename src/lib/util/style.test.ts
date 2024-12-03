import {
  Mock,
  MockInstance,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import * as util from '@app/util';
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
  let plugin: any;
  let iconString: string;
  let container: HTMLElement;

  beforeEach(() => {
    vi.restoreAllMocks();
    iconString = '<svg></svg>';
    container = document.createElement('div');
    plugin = {
      getSettings: () => ({
        fontSize: 16,
        iconColor: '#000000',
        extraMargin: {},
      }),
    };
  });

  it('should call `setFontSize` function with defined font size', () => {
    const setFontSizeSpy = vi.spyOn(svg, 'setFontSize');
    setFontSizeSpy.mockImplementationOnce(() => iconString);
    style.applyAll(plugin as any, iconString, container);
    expect(setFontSizeSpy).toHaveBeenCalledWith(iconString, 16);
  });

  it('should call `colorize` function with defined color', () => {
    const colorize = vi.spyOn(svg, 'colorize');
    colorize.mockImplementationOnce(() => iconString);
    style.applyAll(plugin as any, iconString, container);
    expect(colorize).toHaveBeenCalledWith(iconString, '#000000');
  });

  it('should set icon color of container', () => {
    style.applyAll(plugin as any, iconString, container);
    expect(container.style.color).toBe('#000000');
  });

  it('should set extra margin of container', () => {
    plugin = {
      getSettings: () => ({
        extraMargin: { top: 2, right: 3, bottom: 4, left: 5 },
      }),
    };
    style.applyAll(plugin as any, iconString, container);
    expect(container.style.margin).toBe('2px 3px 4px 5px');
  });

  it('should set default extra margin of container when not specified', () => {
    style.applyAll(plugin as any, iconString, container);
    expect(container.style.margin).toBe('4px');
  });

  it('should apply emoji styles when specified icon is an emoji', () => {
    iconString = '😀';
    style.applyAll(plugin as any, iconString, container);
    expect(container.style.fontSize).toBe('16px');
    expect(container.style.lineHeight).toBe('16px');
  });
});

describe('refreshIconNodes', () => {
  let applyStyles: Mock;
  let getFileItemTitleElSpy: MockInstance;
  let plugin: any;
  let titleEl: HTMLElement;
  let iconNode: HTMLElement;

  beforeEach(() => {
    vi.restoreAllMocks();
    applyStyles = vi.fn();
    getFileItemTitleElSpy = vi.spyOn(util, 'getFileItemTitleEl');
    plugin = {
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
    titleEl = document.createElement('div');
    iconNode = document.createElement('div');
    titleEl.appendChild(iconNode);
  });

  it('should refresh icon nodes', () => {
    iconNode.classList.add('iconize-icon');

    getFileItemTitleElSpy.mockReturnValue(titleEl);

    style.refreshIconNodes(plugin as any, applyStyles);
    expect(applyStyles).toHaveBeenCalledTimes(2);
  });

  it('should not refresh icon nodes if none are found', () => {
    getFileItemTitleElSpy.mockReturnValue(titleEl);

    style.refreshIconNodes(plugin as any, applyStyles);
    expect(applyStyles).toHaveBeenCalledTimes(0);
  });
});
