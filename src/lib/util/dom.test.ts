import { beforeEach, it, expect, describe, vi, MockInstance } from 'vitest';
import * as util from '@app/icon-pack-manager/util';
import dom from './dom';
import svg from './svg';
import style from './style';
import twemoji from '@twemoji/api';

describe('removeIconInNode', () => {
  it('should remove the icon node from the provided element', () => {
    const el = document.createElement('div');
    el.innerHTML = '<svg class="iconize-icon"></svg>';
    dom.removeIconInNode(el);
    expect(el.innerHTML).toEqual('');
  });

  it('should not remove the icon node if it does not exist', () => {
    const el = document.createElement('div');
    el.innerHTML = '<svg></svg>';
    dom.removeIconInNode(el);
    expect(el.innerHTML).toEqual('<svg></svg>');
  });
});

describe('removeIconInPath', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should remove the icon node from the element with the specified path', () => {
    const el = document.createElement('div');
    el.setAttribute('data-path', 'test');
    el.innerHTML = '<div class="iconize-icon"></div>';
    document.body.appendChild(el);
    dom.removeIconInPath('test');
    expect(el.innerHTML).toEqual('');
  });

  it('should not remove the icon node if the element with the path does not exist', () => {
    const el = document.createElement('div');
    el.setAttribute('data-icon', 'test');
    dom.removeIconInPath('test');
    document.body.appendChild(el);
    expect(document.body.innerHTML).not.toEqual('');
  });
});

describe('doesElementHasIconNode', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return `true` if the element has an icon node', () => {
    const el = document.createElement('div');
    el.innerHTML = '<div class="iconize-icon"></div>';
    document.body.appendChild(el);
    expect(dom.doesElementHasIconNode(el)).toBe(true);
  });

  it('should return `false` if the element does not have an icon node', () => {
    const el = document.createElement('div');
    el.innerHTML = '<div></div>';
    document.body.appendChild(el);
    expect(dom.doesElementHasIconNode(el)).toBe(false);
  });
});

describe('getIconFromElement', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('should return the icon node from the element', () => {
    const el = document.createElement('div');
    el.innerHTML = '<div class="iconize-icon" data-icon="IbFoo"></div>';
    document.body.appendChild(el);
    expect(dom.getIconFromElement(el)).toEqual('IbFoo');
  });

  it('should return `undefined` if the element does not have an icon node', () => {
    const el = document.createElement('div');
    el.innerHTML = '<div></div>';
    document.body.appendChild(el);
    expect(dom.getIconFromElement(el)).toBe(undefined);
  });
});

describe('setIconForNode', () => {
  let getSvgFromLoadedIcon: MockInstance;
  let plugin: any;
  beforeEach(() => {
    vi.restoreAllMocks();
    plugin = {
      getSettings: () => ({
        emojiStyle: 'native',
        extraMargin: {},
      }),
      getIconPackManager: () => ({
        getIconPacks: (): any => [],
        getPreloadedIcons: (): any => [],
      }),
    };
    getSvgFromLoadedIcon = vi.spyOn(util, 'getSvgFromLoadedIcon');
    getSvgFromLoadedIcon.mockImplementationOnce(
      () => '<svg test-icon="IbTest"></svg>',
    );
  });

  it('should set the `innerHTML` with the icon for the provided node', () => {
    const node = document.createElement('div');
    dom.setIconForNode(plugin, 'IbTest', node);

    expect(node.innerHTML).toEqual('<svg test-icon="IbTest"></svg>');
  });

  it('should call `svg.colorize` with the provided color when defined', () => {
    const node = document.createElement('div');
    const colorize = vi
      .spyOn(svg, 'colorize')
      .mockImplementationOnce((icon) => icon);

    dom.setIconForNode(plugin, 'IbTest', node, { color: 'purple' });

    expect(colorize).toBeCalledTimes(2); // 2 times because of `applyAll` and `colorize`.
    colorize.mockRestore();
  });

  it('should set the `innerHTML` with the emoji for the provided node', () => {
    getSvgFromLoadedIcon.mockRestore();
    const applyAll = vi
      .spyOn(style, 'applyAll')
      .mockImplementationOnce(() => '😃');

    const node = document.createElement('div');
    dom.setIconForNode(plugin, '😃', node);

    expect(node.innerHTML).toEqual('😃');
    expect(applyAll).toBeCalledTimes(1);

    applyAll.mockRestore();
  });

  it('should parse twemoji if the emoji style is `twemoji`', () => {
    getSvgFromLoadedIcon.mockRestore();
    const applyAll = vi
      .spyOn(style, 'applyAll')
      .mockImplementationOnce(() => '😃');
    const parse = vi.spyOn(twemoji, 'parse').mockImplementationOnce(() => '😃');
    plugin.getSettings().emojiStyle = 'twemoji';

    const node = document.createElement('div');
    dom.setIconForNode(plugin, '😃', node);
    expect(node.innerHTML).toEqual('😃');

    parse.mockRestore();
    applyAll.mockRestore();
  });

  it('should set `shouldApplyAllStyles` to `true` by default', () => {
    const applyAll = vi
      .spyOn(style, 'applyAll')
      .mockImplementationOnce(() => '');

    const node = document.createElement('div');
    dom.setIconForNode(plugin, 'IbTest', node, { color: 'blue' });
    expect(applyAll).toBeCalledTimes(1);

    dom.setIconForNode(plugin, 'IbTest', node);
    expect(applyAll).toBeCalledTimes(2);
  });
});

describe('createIconNode', () => {
  let getSvgFromLoadedIcon: MockInstance;
  let plugin: any;
  beforeEach(() => {
    document.body.innerHTML = '';
    vi.restoreAllMocks();
    plugin = {
      getSettings: () => ({
        extraMargin: {},
      }),
    };
    getSvgFromLoadedIcon = vi.spyOn(util, 'getSvgFromLoadedIcon');
    getSvgFromLoadedIcon.mockImplementationOnce(
      () => '<svg test-icon="IbTest"></svg>',
    );
  });

  it('should create a new icon node with the provided icon name if an icon node does not already exist', () => {
    const el = document.createElement('div');
    el.setAttribute('data-path', 'test');
    el.innerHTML = '<div class="nav-folder-title-content"></div>';
    document.body.appendChild(el);
    dom.createIconNode(plugin, 'test', 'IbTest');
    expect(el).toMatchInlineSnapshot(`<div
  data-path="test"
>
  <div
    class="iconize-icon"
    data-icon="IbTest"
    style="margin: 4px;"
    title="IbTest"
  >
    <svg
      test-icon="IbTest"
    />
  </div>
  <div
    class="nav-folder-title-content"
  />
</div>`);
  });

  it('should set the icon node with the provided icon name if an icon node already exists', () => {
    const el = document.createElement('div');
    el.setAttribute('data-path', 'test');
    el.innerHTML =
      '<div class="nav-folder-title-content"></div><div class="iconize-icon"></div>';
    document.body.appendChild(el);
    dom.createIconNode(plugin, 'test', 'IbTest');
    expect(el).toMatchInlineSnapshot(`<div
  data-path="test"
>
  <div
    class="nav-folder-title-content"
  />
  <div
    class="iconize-icon"
    style="margin: 4px;"
    title="IbTest"
  >
    <svg
      test-icon="IbTest"
    />
  </div>
</div>`);
  });

  it('should fallback to file title content if folder title content does not exist', () => {
    const el = document.createElement('div');
    el.setAttribute('data-path', 'test');
    el.innerHTML =
      '<div class="nav-file-title-content"></div><div class="iconize-icon"></div>';
    document.body.appendChild(el);
    dom.createIconNode(plugin, 'test', 'IbTest');
    expect(el).toMatchInlineSnapshot(`<div
  data-path="test"
>
  <div
    class="nav-file-title-content"
  />
  <div
    class="iconize-icon"
    style="margin: 4px;"
    title="IbTest"
  >
    <svg
      test-icon="IbTest"
    />
  </div>
</div>`);
  });

  it('should not create an icon node if the node with the `data-path` does not exist', () => {
    dom.createIconNode(plugin, 'test', 'IbTest');
    expect(document.body.innerHTML).toEqual('');
  });

  it('should not create an icon node if the file title content and folder title content does not exist', () => {
    const el = document.createElement('div');
    el.setAttribute('data-path', 'test');
    document.body.appendChild(el);
    dom.createIconNode(plugin, 'test', 'IbTest');
    expect(document.body.innerHTML).toEqual('<div data-path="test"></div>');
  });
});
