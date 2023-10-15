import { describe, expect, it, vi } from 'vitest';
import titleIcon from './titleIcon';
import config from '../config';
import svg from './util/svg';

describe('add', () => {
  it('should create a title icon container and add the title icon to it', () => {
    const parentEl = document.createElement('div');
    const contentEl = document.createElement('div');
    parentEl.appendChild(contentEl);

    titleIcon.add(contentEl, '<svg></svg>');
    expect(contentEl).toMatchInlineSnapshot(`<div>
  <div
    class="iconize-title-icon-container"
    style="display: block;"
  >
    <div
      class="iconize-title-icon"
    >
      <svg />
    </div>
  </div>
</div>`);
  });

  it('should add the title icon to an existing title icon container', () => {
    const parentEl = document.createElement('div');
    const contentEl = document.createElement('div');
    const titleIconContainer = document.createElement('div');
    titleIconContainer.classList.add(config.TITLE_ICON_CONTAINER_CLASS);
    titleIconContainer.innerHTML = '<div></div>';
    parentEl.appendChild(contentEl);
    parentEl.appendChild(titleIconContainer);

    titleIcon.add(contentEl, '<svg></svg>');
    expect(titleIconContainer).toMatchInlineSnapshot(`<div
  class="iconize-title-icon-container"
  style="display: block;"
>
  <div
    class="iconize-title-icon"
  >
    <svg />
  </div>
</div>`);
  });

  it('should call `svg.setFontSize if the `fontSize` option is provided', () => {
    const setFontSize = vi.spyOn(svg, 'setFontSize');
    setFontSize.mockImplementationOnce(() => '<svg></svg>');

    const parentEl = document.createElement('div');
    const contentEl = document.createElement('div');
    parentEl.appendChild(contentEl);

    titleIcon.add(contentEl, '<svg></svg>', { fontSize: 10 });
    expect(setFontSize).toBeCalledTimes(1);
    expect(setFontSize).toHaveBeenCalledWith('<svg></svg>', 10);

    setFontSize.mockRestore();
  });
});

describe('remove', () => {
  it('should set the `display` style to `none`, if the title icon container exists', () => {
    const parentEl = document.createElement('div');
    const contentEl = document.createElement('div');
    parentEl.appendChild(contentEl);
    contentEl.innerHTML = `<div class="${config.TITLE_ICON_CONTAINER_CLASS}"></div>`;
    titleIcon.remove(contentEl);
    expect((contentEl.children[0] as HTMLElement).style.display).toEqual(
      'none',
    );
  });

  it('should not set the `display` style to `none`, if the title icon container does not exist', () => {
    const parentEl = document.createElement('div');
    const contentEl = document.createElement('div');
    parentEl.appendChild(contentEl);
    contentEl.innerHTML = '<div></div>';
    titleIcon.remove(contentEl);
    expect(contentEl.innerHTML).toEqual('<div></div>');
  });

  it('should not set the `display` style to `none`, if the parent container does not exist', () => {
    const contentEl = document.createElement('div');
    contentEl.innerHTML = '<div></div>';
    titleIcon.remove(contentEl);
    expect(contentEl.innerHTML).toEqual('<div></div>');
  });
});
