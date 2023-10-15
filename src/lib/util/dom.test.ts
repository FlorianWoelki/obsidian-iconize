import { beforeEach, it, expect, describe } from 'vitest';
import dom from './dom';

describe('removeIconInNode', () => {
  it('should remove the icon node from the provided element', () => {
    const el = document.createElement('div');
    el.innerHTML = '<svg class="obsidian-icon-folder-icon"></svg>';
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
    el.innerHTML = '<div class="obsidian-icon-folder-icon"></div>';
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
    el.innerHTML = '<div class="obsidian-icon-folder-icon"></div>';
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
    el.innerHTML =
      '<div class="obsidian-icon-folder-icon" data-icon="IbFoo"></div>';
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
