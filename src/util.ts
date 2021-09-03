// @ts-ignore
import * as remixicons from '../remixicons';
import IconFolderPlugin from './main';

interface FoundNode {
  node: Element;
  value: string;
}

export const getAllIcons = () => {
  return remixicons;
};

export const getIcon = (name: string) => {
  return remixicons[name];
};

export const waitForDataNodes = (data: [string, string]): Promise<FoundNode[]> => {
  return new Promise((resolve) => {
    const foundNodes: FoundNode[] = [];
    const observer = new MutationObserver(() => {
      data.forEach(([key, value]) => {
        const node = document.querySelector(`[data-path="${key}"]`);
        if (node && foundNodes.filter(({ value: foundValue }) => value === foundValue).length === 0) {
          foundNodes.push({ node, value });
        }
      });

      if (foundNodes.length === data.length) {
        resolve(foundNodes);
        observer.disconnect();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
};

export const removeFromDOM = (path: string) => {
  const node = document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  const iconNode = node.querySelector('.obsidian-icon-folder-icon');
  if (!iconNode) {
    console.error('icon element does not exist', path);
    return;
  }

  iconNode.remove();
};

export const addToDOMWithElement = (iconId: string, node: Element): void => {
  const titleNode = node.querySelector('.nav-folder-title-content');
  if (!titleNode) {
    console.error('element with title not found');
    return;
  }

  const iconNode = document.createElement('div');
  iconNode.classList.add('obsidian-icon-folder-icon');
  iconNode.innerHTML = getIcon(iconId);

  node.insertBefore(iconNode, titleNode);
};

export const addToDOM = (plugin: IconFolderPlugin, path: string, iconId: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  addToDOMWithElement(iconId, node);
};
