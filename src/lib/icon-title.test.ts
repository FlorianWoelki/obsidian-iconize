import { describe, expect, it, vi } from 'vitest';
import titleIcon from './icon-title';
import config from '../config';
import svg from './util/svg';

describe('add', () => {
  it('should create a title icon', () => {
    const parentEl = document.createElement('div');
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(inlineTitleEl);

    titleIcon.add(inlineTitleEl, '<svg></svg>');
    expect(parentEl).toMatchInlineSnapshot(`<div>
  <div
    class="iconize-title-icon"
    style="display: block;"
  >
    <svg />
  </div>
  <div />
</div>`);
  });

  it('should create a title icon with a font size when the passed in element is not an svg element', () => {
    const parentEl = document.createElement('div');
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(inlineTitleEl);

    titleIcon.add(inlineTitleEl, '👍', { fontSize: 10 });
    expect(parentEl).toMatchInlineSnapshot(`<div>
  <div
    class="iconize-title-icon"
    style="display: block; font-size: 10px;"
  >
    👍
  </div>
  <div />
</div>`);
  });

  it('should update the title icon when the title icon already exist', () => {
    const parentEl = document.createElement('div');
    const inlineTitleEl = document.createElement('div');
    const titleIconEl = document.createElement('div');
    titleIconEl.classList.add(config.TITLE_ICON_CLASS);
    parentEl.appendChild(titleIconEl);
    parentEl.appendChild(inlineTitleEl);

    titleIcon.add(inlineTitleEl, '<svg></svg>');
    expect(parentEl).toMatchInlineSnapshot(`<div>
  <div
    class="iconize-title-icon"
    style="display: block;"
  >
    <svg />
  </div>
  <div />
</div>`);
  });

  it('should call `svg.setFontSize if the `fontSize` option is provided', () => {
    const setFontSize = vi.spyOn(svg, 'setFontSize');
    setFontSize.mockImplementationOnce(() => '<svg></svg>');

    const parentEl = document.createElement('div');
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(inlineTitleEl);

    titleIcon.add(inlineTitleEl, '<svg></svg>', { fontSize: 10 });
    expect(setFontSize).toBeCalledTimes(1);
    expect(setFontSize).toHaveBeenCalledWith('<svg></svg>', 10);

    setFontSize.mockRestore();
  });
});

describe('hide', () => {
  it('should set the `display` style to `none`, if the title icon element exists', () => {
    const parentEl = document.createElement('div');
    const titleIconEl = document.createElement('div');
    titleIconEl.classList.add(config.TITLE_ICON_CLASS);
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(titleIconEl);
    parentEl.appendChild(inlineTitleEl);
    titleIcon.hide(inlineTitleEl);
    expect((parentEl.children[0] as HTMLElement).style.display).toEqual('none');
  });

  it('should not set the `display` style to `none`, if the title icon container does not exist', () => {
    const parentEl = document.createElement('div');
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(inlineTitleEl);
    inlineTitleEl.innerHTML = '<div></div>';
    titleIcon.hide(inlineTitleEl);
    expect(inlineTitleEl.innerHTML).toEqual('<div></div>');
  });

  it('should not set the `display` style to `none`, if the parent container does not exist', () => {
    const inlineTitleEl = document.createElement('div');
    inlineTitleEl.innerHTML = '<div></div>';
    titleIcon.hide(inlineTitleEl);
    expect(inlineTitleEl.innerHTML).toEqual('<div></div>');
  });
});

describe('remove', () => {
  it('should remove the title icon element, if the title icon element exists', () => {
    const parentEl = document.createElement('div');
    const titleIconEl = document.createElement('div');
    titleIconEl.classList.add(config.TITLE_ICON_CLASS);
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(titleIconEl);
    parentEl.appendChild(inlineTitleEl);
    titleIcon.remove(inlineTitleEl);
    expect(parentEl.children.length).toEqual(1);
  });

  it('should not remove the title icon element, if the title icon element does not exist', () => {
    const parentEl = document.createElement('div');
    const inlineTitleEl = document.createElement('div');
    parentEl.appendChild(inlineTitleEl);
    inlineTitleEl.innerHTML = '<div></div>';
    titleIcon.remove(inlineTitleEl);
    expect(inlineTitleEl.innerHTML).toEqual('<div></div>');
  });

  it('should not remove the title icon element, if the parent container does not exist', () => {
    const inlineTitleEl = document.createElement('div');
    inlineTitleEl.innerHTML = '<div></div>';
    titleIcon.remove(inlineTitleEl);
    expect(inlineTitleEl.innerHTML).toEqual('<div></div>');
  });
});
