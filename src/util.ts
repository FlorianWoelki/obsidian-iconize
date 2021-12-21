import * as remixicons from '../remixicons';
import * as faLine from '../fontawesome/index-line';
import * as faFill from '../fontawesome/index-fill';
import * as faBrands from '../fontawesome/index-brands';

import IconFolderPlugin, { FolderIconObject } from './main';
import { ExplorerLeaf } from './@types/obsidian';
import { IconFolderSettings } from './settings';

/**
 * `transformedIcons` includes all the icon packs with their corresponding prefix.
 */
const transformedIcons = {
  faFill: Object.keys(faFill).map((iconName) => 'Fa' + iconName),
  faLine: Object.keys(faLine).map((iconName) => 'Fa' + iconName),
  faBrands: Object.keys(faBrands).map((iconName) => 'Fa' + iconName),
  remixIcons: Object.keys(remixicons).map((iconName) => 'Ri' + iconName),
};

/**
 * This function checks whether the passed `iconName` is a `fill` or `line` icon.
 * Based on this condition it will return `true` or `false` based on the enabled settings.
 *
 * @private
 * @param {string} iconName - Represents the icon name like `RiAB`.
 * @param {IconFolderSettings} settings - The saved settings of the plugin.
 * @returns {boolean} If the icon should be included/enabled or not.
 */
const mapRemixicons = (iconName: string, settings: IconFolderSettings): boolean => {
  if (iconName.toLowerCase().includes('fill')) {
    return settings.enableRemixiconsFill;
  } else if (iconName.toLowerCase().includes('line')) {
    return settings.enableRemixiconsLine;
  }

  return true;
};

/**
 * This function returns all enabled icons.
 *
 * For example: if `Remixicons Fill` and `Fontawesome Fill` is activated, it will return all these icons.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin file.
 * @returns {string[]} The enabled icons.
 */
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

/**
 * This function transforms an icon that includes a prefix and returns the correct svg string.
 *
 * For example: This input: `RiAB` will return only `AB` as a svg.
 *
 * @public
 * @param {string} name - The icon name.
 * @returns {string} The correct transformed svg.
 */
export const getIcon = (name: string): string => {
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
    iconSvg = remixicons[name.substr(2)];
  }

  return iconSvg;
};

/**
 * This function returns the svg string with the user defined css settings.
 * It handles from the settings the `padding`, `color`, and `size`.
 *
 * In addition, this function manipulates the passed element with the user defined setting `padding`.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} iconSvg - The to be styled icon svg.
 * @param {HTMLElement} el - The element that will include the padding from the user settings.
 * @returns {string} The svg with the customized css settings.
 */
export const customizeIconStyle = (plugin: IconFolderPlugin, iconSvg: string, el: HTMLElement): string => {
  // Allow custom font size
  const sizeRe = new RegExp(/width="\d+" height="\d+"/g);
  iconSvg = iconSvg.replace(
    sizeRe,
    `width="${plugin.getSettings().fontSize}" height="${plugin.getSettings().fontSize}"`,
  );

  // Allow custom icon color
  const colorRe = new RegExp(/fill="(\w|#)+"/g);
  iconSvg = iconSvg.replace(colorRe, `fill="${plugin.getSettings().iconColor ?? 'currentColor'}"`);

  // Change padding of icon
  if (plugin.getSettings().extraPadding) {
    el.style.padding = `${plugin.getSettings().extraPadding.top ?? 2}px ${
      plugin.getSettings().extraPadding.right ?? 2
    }px ${plugin.getSettings().extraPadding.bottom ?? 2}px ${plugin.getSettings().extraPadding.left ?? 2}px`;
  }

  return iconSvg;
};

/**
 * This function adds the icons to the DOM.
 * For that, it will create a `div` element with the class `obsidian-icon-folder-icon` that will be customized based on the user settings.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {[string, string | FolderIconObject][]} data - The data that includes the icons.
 * @param {WeakMap<ExplorerLeaf, boolean>} registeredFileExplorers - The already registered file explorers.
 */
export const addIconsToDOM = (
  plugin: IconFolderPlugin,
  data: [string, string | FolderIconObject][],
  registeredFileExplorers: WeakMap<ExplorerLeaf, boolean>,
  callback?: () => void,
): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    if (registeredFileExplorers.has(fileExplorer)) {
      return;
    }

    registeredFileExplorers.set(fileExplorer, true);

    // create a map with registered file paths to have constant look up time
    const registeredFilePaths: Record<string, boolean> = {};
    data.forEach(([path]) => {
      registeredFilePaths[path] = true;
    });

    data.forEach(([dataPath, value]) => {
      const fileItem = fileExplorer.view.fileItems[dataPath];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const titleInnerEl = fileItem.titleInnerEl;

        // needs to check because of the refreshing the plugin will duplicate all the icons
        if (titleEl.children.length === 2 || titleEl.children.length === 1) {
          const iconName = typeof value === 'string' ? value : value.iconName;
          if (iconName) {
            const iconNode = titleEl.createDiv();
            iconNode.classList.add('obsidian-icon-folder-icon');
            iconNode.innerHTML = customizeIconStyle(plugin, getIcon(iconName), iconNode);

            titleEl.insertBefore(iconNode, titleInnerEl);
          }

          if (typeof value === 'object' && value.inheritanceIcon) {
            const files = plugin.app.vault.getFiles().filter((f) => f.path.includes(dataPath));
            const inheritanceIconName = value.inheritanceIcon;
            files.forEach((f) => {
              if (!registeredFilePaths[f.path]) {
                const inheritanceFileItem = fileExplorer.view.fileItems[f.path];
                const iconNode = inheritanceFileItem.titleEl.createDiv();
                iconNode.classList.add('obsidian-icon-folder-icon');
                iconNode.innerHTML = customizeIconStyle(plugin, getIcon(inheritanceIconName), iconNode);

                inheritanceFileItem.titleEl.insertBefore(iconNode, inheritanceFileItem.titleInnerEl);
              }
            });
          }
        }
      }
    });

    if (callback) {
      callback();
    }
  });
};

export const addInheritanceIconToFile = (
  plugin: IconFolderPlugin,
  registeredFileExplorers: WeakMap<ExplorerLeaf, boolean>,
  filePath: string,
  iconName: string,
): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    if (registeredFileExplorers.has(fileExplorer)) {
      const fileItem = fileExplorer.view.fileItems[filePath];
      console.log(fileItem);
      if (fileItem) {
        const iconNode = fileItem.titleEl.createDiv();
        iconNode.classList.add('obsidian-icon-folder-icon');
        iconNode.innerHTML = customizeIconStyle(plugin, getIcon(iconName), iconNode);

        fileItem.titleEl.insertBefore(iconNode, fileItem.titleInnerEl);
      }
    }
  });
};

/**
 * This function refreshes the icon style.
 * For that, it will manipulate the `innerHTML` of the icon and will customize the style.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 */
export const refreshIconStyle = (plugin: IconFolderPlugin): void => {
  const data = Object.entries(plugin.getData()) as [string, string];
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    data.forEach(([key]) => {
      const fileItem = fileExplorer.view.fileItems[key];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const iconNode = titleEl.querySelector('.obsidian-icon-folder-icon') as HTMLElement;
        iconNode.innerHTML = customizeIconStyle(plugin, iconNode.innerHTML, iconNode);
      }
    });
  });
};

/**
 * This function removes the icon node from the DOM based on the passed in path.
 *
 * @public
 * @param {string} path - The path toe the to be removed DOM element.
 */
export const removeFromDOM = (path: string): void => {
  const node = document.querySelector(`[data-path="${path}"]`);
  if (!node) {
    console.error('element with data path not found', path);
    return;
  }

  const iconNode = node.querySelector('.obsidian-icon-folder-icon');
  if (!iconNode) {
    return;
  }

  iconNode.remove();
};

/**
 * This function adds an icon to the DOM based on a specific path.
 * In addition, before added to the DOM, it will customize the icon style.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} path - The path in the DOM where the icon will be added.
 * @param {string} iconId - The icon id that will be added to the DOM.
 */
export const addToDOM = (plugin: IconFolderPlugin, path: string, iconId: string): void => {
  if (plugin.getData()[path]) {
    removeFromDOM(path);
  }

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

  // check if there is a possible inheritance icon in the DOM
  const possibleInheritanceIcon = node.querySelector('.obsidian-icon-folder-icon');
  if (possibleInheritanceIcon) {
    possibleInheritanceIcon.remove();
  }

  const iconNode = document.createElement('div');
  iconNode.classList.add('obsidian-icon-folder-icon');
  iconNode.innerHTML = customizeIconStyle(plugin, getIcon(iconId), iconNode);

  node.insertBefore(iconNode, titleNode);
};

/**
 * This function will add inheritance functionality to a specific folder.
 * It will add the inheritance icon to all child files.
 *
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} folderPath - The path in the DOM where the icon will be added.
 */
export const addInheritanceForFolder = (plugin: IconFolderPlugin, folderPath: string): void => {
  const folder = plugin.getData()[folderPath];
  if (!folder || typeof folder !== 'object') {
    return;
  }

  // add icons for all the child files
  const files = plugin.app.vault.getFiles().filter((f) => f.path.includes(folderPath));
  files.forEach((f) => {
    if (plugin.getData()[f.path]) {
      removeFromDOM(f.path);
      plugin.removeFolderIcon(f.path);
    }

    addToDOM(plugin, f.path, (folder as any).inheritanceIcon);
  });
};

/**
 * This function removes inheritance from a folder.
 * It will delete all the icons in the sub files of this folder.
 *
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} folderPath - The path in the DOM where the icon will be added.
 */
export const removeInheritanceForFolder = (plugin: IconFolderPlugin, folderPath: string): void => {
  const folder = plugin.getData()[folderPath];
  if (!folder || typeof folder !== 'object') {
    return;
  }

  // remove icons from all the child files
  const files = plugin.app.vault.getFiles().filter((f) => f.path.includes(folderPath));
  files.forEach((f) => {
    // when the file path is not registered in the data it should remove the icon
    if (!plugin.getData()[f.path]) {
      removeFromDOM(f.path);
    }
  });
};
