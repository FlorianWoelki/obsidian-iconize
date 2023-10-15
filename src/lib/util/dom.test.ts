import { it, expect, describe } from 'vitest';
import dom from './dom';

describe('removeIconInNode', () => {
  it('should remove the icon node from the provided HTMLElement', () => {
    const el = document.createElement('div');
    el.innerHTML = '<svg class="obsidian-icon-folder-icon"></svg>';
    dom.removeIconInNode(el);
    expect(el.innerHTML).toEqual('');
  });

  it('should not remove the icon node if it does not exist', () => {
    const el = document.createElement('div');
    el.innerHTML = '<svg class="obsidian-icon-folder-icon"></svg>';
    dom.removeIconInNode(el);
    expect(el.innerHTML).toEqual('');
  });
});
