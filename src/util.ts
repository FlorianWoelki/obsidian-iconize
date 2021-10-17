import * as remixicons from '../remixicons';
import IconFolderPlugin from './main';
import { ExplorerLeaf } from './@types/obsidian';
import { IconFolderSettings } from './settings';

const mapIcon = (iconName: string, settings: IconFolderSettings): boolean => {
  if (iconName.toLowerCase().includes('fill')) {
    return settings.enableRemixiconsFill;
  } else if (iconName.toLowerCase().includes('line')) {
    return settings.enableRemixiconsLine;
  }

  return true;
};

export const getEnabledIcons = (plugin: IconFolderPlugin) => {
  const icons = Object.keys(remixicons).filter((key) => {
    return mapIcon(key, plugin.getSettings());
  });

  return icons;
};

export const getIcon = (name: string) => {
  return remixicons[name];
};

export const addIconsToDOM = (
  plugin: IconFolderPlugin,
  data: [string, string],
  registeredFileExplorers: WeakMap<ExplorerLeaf, boolean>,
) => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    if (registeredFileExplorers.has(fileExplorer)) {
      return;
    }

    registeredFileExplorers.set(fileExplorer, true);
    data.forEach(([key, value]) => {
      const fileItem = fileExplorer.view.fileItems[key];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const titleInnerEl = fileItem.titleInnerEl;

        const iconNode = titleEl.createDiv();
        iconNode.classList.add('obsidian-icon-folder-icon');
        iconNode.innerHTML = getIcon(value.substring(2));

        titleEl.insertBefore(iconNode, titleInnerEl);
      }
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

export const addToDOM = (path: string, iconId: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

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
