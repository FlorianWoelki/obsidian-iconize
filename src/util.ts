import * as remixicons from '../remixicons';
import * as faLine from '../fontawesome/index-line';
import * as faFill from '../fontawesome/index-fill';
import * as faBrands from '../fontawesome/index-brands';

import IconFolderPlugin from './main';
import { ExplorerLeaf } from './@types/obsidian';
import { IconFolderSettings } from './settings';

const transformedIcons = {
  faFill: Object.keys(faFill).map((iconName) => 'Fa' + iconName),
  faLine: Object.keys(faLine).map((iconName) => 'Fa' + iconName),
  faBrands: Object.keys(faBrands).map((iconName) => 'Fa' + iconName),
  remixIcons: Object.keys(remixicons).map((iconName) => 'Ri' + iconName),
};

const mapRemixicons = (iconName: string, settings: IconFolderSettings): boolean => {
  if (iconName.toLowerCase().includes('fill')) {
    return settings.enableRemixiconsFill;
  } else if (iconName.toLowerCase().includes('line')) {
    return settings.enableRemixiconsLine;
  }

  return true;
};

export const getEnabledIcons = (plugin: IconFolderPlugin): string[] => {
  const settings = plugin.getSettings();
  const icons = transformedIcons.remixIcons.filter((key) => {
    return mapRemixicons(key, settings);
  });

  if (settings.enableFontawesomeFill) {
    icons.push(...transformedIcons.faFill);
  }
  if (settings.enableFontawesomeLine) {
    icons.push(...transformedIcons.faLine);
  }
  if (settings.enableFontawesomeBrands) {
    icons.push(...transformedIcons.faBrands);
  }

  return icons;
};

export const getIcon = (plugin: IconFolderPlugin, name: string): string => {
  const prefix = name.substr(0, 2);
  let iconSvg: string = '';
  if (prefix === 'Fa') {
    if (name.toLowerCase().substr(name.length - 4) === 'line') {
      iconSvg = faLine[name.substr(2)];
    } else if (name.toLowerCase().substr(name.length - 4) === 'fill') {
      iconSvg = faFill[name.substr(2)];
    } else {
      iconSvg = faBrands[name.substr(2)];
    }
  } else if (prefix === 'Ri') {
    iconSvg = remixicons[name.substr(2)];
  } else {
    iconSvg = remixicons[name];
  }

  return customizeIconStyle(plugin, iconSvg);
};

export const customizeIconStyle = (plugin: IconFolderPlugin, iconSvg: string): string => {
  // Allow custom font size
  const sizeRe = new RegExp(/width="\d+" height="\d+"/g);
  iconSvg = iconSvg.replace(
    sizeRe,
    `width="${plugin.getSettings().fontSize}" height="${plugin.getSettings().fontSize}"`,
  );

  // Allow custom icon color
  if (plugin.getSettings().iconColor) {
    const colorRe = new RegExp(/fill="(\w|#)+"/g);
    iconSvg = iconSvg.replace(colorRe, `fill="${plugin.getSettings().iconColor}"`);
  }
  return iconSvg;
};

export const addIconsToDOM = (
  plugin: IconFolderPlugin,
  data: [string, string],
  registeredFileExplorers: WeakMap<ExplorerLeaf, boolean>,
): void => {
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

        // needs to check because of the refreshing the plugin will duplicate all the icons
        if (titleEl.children.length === 2) {
          const iconNode = titleEl.createDiv();
          iconNode.classList.add('obsidian-icon-folder-icon');
          iconNode.innerHTML = getIcon(plugin, value.substring(2));

          titleEl.insertBefore(iconNode, titleInnerEl);
        }
      }
    });
  });
};

export const refreshIconStyle = (plugin: IconFolderPlugin): void => {
  const data = Object.entries(plugin.getData()) as [string, string];
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    data.forEach(([key]) => {
      const fileItem = fileExplorer.view.fileItems[key];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon');
        iconNode.innerHTML = customizeIconStyle(plugin, iconNode.innerHTML);
      }
    });
  });
};

export const removeFromDOM = (path: string): void => {
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

export const addToDOM = (plugin: IconFolderPlugin, path: string, iconId: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  let titleNode = node.querySelector('.nav-folder-title-content');
  if (!titleNode) {
    titleNode = node.querySelector('.nav-file-title-content');

    if (!titleNode) {
      console.error('element with title not found');
      return;
    }
  }

  const iconNode = document.createElement('div');
  iconNode.classList.add('obsidian-icon-folder-icon');
  iconNode.innerHTML = getIcon(plugin, iconId);

  node.insertBefore(iconNode, titleNode);
};
