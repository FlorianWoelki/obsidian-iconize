import * as remixicons from 'react-icons/ri/index';
// @ts-ignore
import { renderToString } from 'react-dom/server';
import IconFolderPlugin from './main';

export const waitForNode = (selector: string): Promise<Element> => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        resolve(document.querySelector(selector));
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}

export const addToDOMWithElement = (plugin: IconFolderPlugin, path: string, iconId: string, node: Element): void => {
  const titleNode = node.querySelector('.nav-folder-title-content');
  if (!titleNode) {
    console.error('element with title not found');
    return;
  }

  const iconNode = document.createElement('div');
  iconNode.classList.add('obsidian-icon-folder-icon');
  iconNode.innerHTML = renderToString(
    // @ts-ignore
    remixicons[iconId]({
      size: '16px',
    }),
  )
  
  node.insertBefore(iconNode, titleNode);
  plugin.addFolderIcon(path, iconId);
}

export const addToDOM = (plugin: IconFolderPlugin, path: string, iconId: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  addToDOMWithElement(plugin, path, iconId, node);
};
