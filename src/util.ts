import twemoji from 'twemoji';
import IconFolderPlugin, { FolderIconObject } from './main';
import type { ExplorerView } from './@types/obsidian';
import { getAllLoadedIconNames, getSvgFromLoadedIcon, Icon, nextIdentifier } from './iconPackManager';
import { CustomRule, IconFolderSettings } from './settings';
import { TAbstractFile } from 'obsidian';

/**
 * This function returns all enabled icons.
 *
 * For example: if `Remixicons Fill` and `Fontawesome Fill` is activated, it will return all these icons.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin file.
 * @returns {string[]} The enabled icons.
 */
export const getEnabledIcons = (plugin: IconFolderPlugin): Icon[] => {
  const settings = plugin.getSettings();
  /*const icons = transformedIcons.remixIcons.filter((key) => {
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

  if (settings.enableDevicons) {
    icons.push(...transformedIcons.deviconIcons);
  }*/

  return getAllLoadedIconNames();
};

/**
 * This function returns the svg string with the user defined css settings.
 * It handles from the settings the `margin`, `color`, and `size`.
 *
 * In addition, this function manipulates the passed element with the user defined setting `margin`.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} icon - The to be styled icon.
 * @param {HTMLElement} el - The element that will include the margin from the user settings.
 * @returns {string} The svg with the customized css settings.
 */
export const customizeIconStyle = (plugin: IconFolderPlugin, icon: string, el: HTMLElement): string => {
  // Allow custom font size
  const widthRe = new RegExp(/width="\d+(px)?"/);
  const heightRe = new RegExp(/height="\d+(px)?"/);
  if (icon.match(widthRe)) {
    icon = icon.replace(widthRe, `width="${plugin.getSettings().fontSize}px"`);
  }
  if (icon.match(heightRe)) {
    icon = icon.replace(heightRe, `height="${plugin.getSettings().fontSize}px"`);
  }

  // Allow custom icon color.
  icon = colorizeIcon(icon, plugin.getSettings().iconColor);

  // Change margin of icon
  const margin = plugin.getSettings().extraMargin;
  const normalizedMargin = {
    top: margin.top !== undefined ? margin.top : 4,
    right: margin.right !== undefined ? margin.right : 4,
    left: margin.left !== undefined ? margin.left : 4,
    bottom: margin.bottom !== undefined ? margin.bottom : 4,
  };
  if (plugin.getSettings().extraMargin) {
    el.style.margin = `${normalizedMargin.top}px ${normalizedMargin.right}px ${normalizedMargin.bottom}px ${normalizedMargin.left}px`;
  }

  return icon;
};

const colorizeIcon = (icon: string, c: string | undefined): string => {
  const parser = new DOMParser();
  const parsedString = parser.parseFromString(icon, 'text/html');
  const iconElement = parsedString.querySelector('svg');

  if (iconElement) {
    if (iconElement.hasAttribute('fill') && iconElement.getAttribute('fill') !== 'none') {
      iconElement.setAttribute('fill', c ?? 'currentColor');
    } else if (iconElement.hasAttribute('stroke') && iconElement.getAttribute('stroke') !== 'none') {
      iconElement.setAttribute('stroke', c ?? 'currentColor');
    }

    return iconElement.outerHTML;
  }

  return icon;
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
  registeredFileExplorers: WeakSet<ExplorerView>,
  callback?: () => void,
): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    if (registeredFileExplorers.has(fileExplorer.view)) {
      return;
    }

    registeredFileExplorers.add(fileExplorer.view);

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
            const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
            if (existingIcon) {
              existingIcon.remove();
            }

            const iconNode = titleEl.createDiv();
            iconNode.classList.add('obsidian-icon-folder-icon');

            insertIconToNode(plugin, iconName, iconNode);

            titleEl.insertBefore(iconNode, titleInnerEl);
          }

          if (typeof value === 'object' && value.inheritanceIcon) {
            const files = plugin.app.vault.getFiles().filter((f) => f.path.includes(dataPath));
            const inheritanceIconName = value.inheritanceIcon;
            files.forEach((f) => {
              if (!registeredFilePaths[f.path]) {
                const inheritanceFileItem = fileExplorer.view.fileItems[f.path];
                const existingIcon = inheritanceFileItem.titleEl.querySelector('.obsidian-icon-folder-icon');
                if (existingIcon) {
                  existingIcon.remove();
                }

                const iconNode = inheritanceFileItem.titleEl.createDiv();
                iconNode.classList.add('obsidian-icon-folder-icon');

                insertIconToNode(plugin, inheritanceIconName, iconNode);

                inheritanceFileItem.titleEl.insertBefore(iconNode, inheritanceFileItem.titleInnerEl);
              }
            });
          }
        }
      }
    });

    const addCustomIconRule = (rule: CustomRule, file: TAbstractFile) => {
      const fileItem = fileExplorer.view.fileItems[file.path];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const titleInnerEl = fileItem.titleInnerEl;
        const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
        if (!existingIcon) {
          const iconNode = titleEl.createDiv();
          iconNode.classList.add('obsidian-icon-folder-icon');

          insertIconToNode(plugin, rule.icon, iconNode, rule.color);

          titleEl.insertBefore(iconNode, titleInnerEl);
        }
      }
    };

    // Add custom rule icons.
    plugin.getSettings().rules.forEach((rule) => {
      try {
        // Rule is in some sort of regex.
        const regex = new RegExp(rule.rule);
        plugin.app.vault.getAllLoadedFiles().forEach(async (file) => {
          const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
          if (file.name.match(regex) && isToRuleApplicable(rule, fileType)) {
            addCustomIconRule(rule, file);
          }
        });
      } catch {
        // Rule is not applicable to a regex format.
        plugin.app.vault.getAllLoadedFiles().forEach(async (file) => {
          const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
          if (file.name.includes(rule.rule) && isToRuleApplicable(rule, fileType)) {
            addCustomIconRule(rule, file);
          }
        });
      }
    });

    if (callback) {
      callback();
    }
  });
};

export const addInheritanceIconToFile = (
  plugin: IconFolderPlugin,
  registeredFileExplorers: WeakSet<ExplorerView>,
  filePath: string,
  iconName: string,
): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    if (registeredFileExplorers.has(fileExplorer.view)) {
      const fileItem = fileExplorer.view.fileItems[filePath];
      if (fileItem) {
        const iconNode = fileItem.titleEl.createDiv();
        iconNode.classList.add('obsidian-icon-folder-icon');

        insertIconToNode(plugin, iconName, iconNode);

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
  const data = Object.entries(plugin.getData());
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
export const removeFromDOM = (path: string, el?: HTMLElement): void => {
  const node = el ?? document.querySelector(`[data-path="${path}"]`);
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

export const updateIcon = (plugin: IconFolderPlugin, file: TAbstractFile) => {
  // Try to add custom rule icons back.
  plugin.getSettings().rules.forEach(async (rule) => {
    addCustomRuleIconsToDOM(plugin, rule, file);
  });
};

/**
 * This function checks if a custom rule icon exists in the path.
 *
 * @param {CustomRule} rule - The custom rule that will be checked on.
 * @param {string} path - The path that will be checked on.
 * @returns {boolean} If the icon with the path and rule exists and should be removed.
 */
export const doesCustomRuleIconExists = (rule: CustomRule, path: string): boolean => {
  const name = path.split('/').pop();
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (name.match(regex)) {
      return true;
    }
  } catch {
    // Rule is not applicable to a regex format.
    if (name.includes(rule.rule)) {
      return true;
    }
  }

  return false;
};

/**
 * This function removes the specified rule from all the loaded files in the vault.
 *
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {CustomRule} rule - Specific rule that will match all loaded files.
 */
export const removeCustomRuleIconsFromDOM = (plugin: IconFolderPlugin, rule: CustomRule): void => {
  const inheritanceFolders = Object.entries(plugin.getData()).filter(
    ([k, v]) => k !== 'settings' && typeof v === 'object',
  );

  plugin.getRegisteredFileExplorers().forEach(async (explorerView) => {
    const files = Object.entries(explorerView.fileItems);
    files.forEach(async ([path, fileItem]) => {
      const fileType = (await plugin.app.vault.adapter.stat(path)).type;
      const dataFile =
        typeof plugin.getData()[path] === 'object'
          ? (plugin.getData()[path] as FolderIconObject).iconName
          : plugin.getData()[path];
      const isInfluencedByInheritance = inheritanceFolders.find(([key]) => path.includes(key) && fileType === 'file');

      const existingIcon = dataFile || isInfluencedByInheritance;
      if (!existingIcon && doesCustomRuleIconExists(rule, path) && isToRuleApplicable(rule, fileType)) {
        removeFromDOM(path, fileItem.titleEl);
      }
    });
  });
};

export const colorizeCustomRuleIcons = (plugin: IconFolderPlugin, rule: CustomRule): void => {
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    plugin.app.vault.getAllLoadedFiles().forEach(async (file) => {
      const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
      if (file.name.match(regex) && isToRuleApplicable(rule, fileType)) {
        addToDOM(plugin, file.path, rule.icon, rule.color);
      }
    });
  } catch {
    // Rule is not applicable to a regex format.
    plugin.app.vault.getAllLoadedFiles().forEach(async (file) => {
      const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
      if (file.name.includes(rule.rule) && isToRuleApplicable(rule, fileType)) {
        addToDOM(plugin, file.path, rule.icon, rule.color);
      }
    });
  }
};

const isToRuleApplicable = (rule: CustomRule, fileType: 'file' | 'folder'): boolean => {
  return (
    rule.for === 'everything' ||
    (rule.for === 'files' && fileType === 'file') ||
    (rule.for === 'folders' && fileType === 'folder')
  );
};

/**
 * This function adds to all the loaded files the icon based on the specific rule.
 *
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {CustomRule} rule - The custom rule for adding the icon.
 * @param {TAbstractFile} file - Optional parameter if the rule should only be applied to one specific file.
 */
export const addCustomRuleIconsToDOM = async (
  plugin: IconFolderPlugin,
  rule: CustomRule,
  file?: TAbstractFile,
): Promise<void> => {
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (file) {
      const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
      if (file.name.match(regex) && isToRuleApplicable(rule, fileType)) {
        addToDOM(plugin, file.path, rule.icon, rule.color);
      }
    } else {
      plugin.getRegisteredFileExplorers().forEach(async (explorerView) => {
        const files = Object.entries(explorerView.fileItems);
        files.forEach(async ([path, fileItem]) => {
          const fileType = (await plugin.app.vault.adapter.stat(path)).type;
          if (fileItem) {
            const fileName = path.split('/').pop();
            if (fileName.match(regex) && isToRuleApplicable(rule, fileType)) {
              const titleEl = fileItem.titleEl;
              const titleInnerEl = fileItem.titleInnerEl;
              const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
              if (!existingIcon) {
                const iconNode = titleEl.createDiv();
                iconNode.classList.add('obsidian-icon-folder-icon');

                insertIconToNode(plugin, rule.icon, iconNode);

                titleEl.insertBefore(iconNode, titleInnerEl);
              }
            }
          }
        });
      });
    }
  } catch {
    // Rule is not applicable to a regex format.
    if (file) {
      const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
      if (file.name.includes(rule.rule) && isToRuleApplicable(rule, fileType)) {
        addToDOM(plugin, file.path, rule.icon, rule.color);
      }
    } else {
      plugin.app.vault.getAllLoadedFiles().forEach(async (file) => {
        const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
        if (file.name.includes(rule.rule) && isToRuleApplicable(rule, fileType)) {
          addToDOM(plugin, file.path, rule.icon, rule.color);
        }
      });
    }
  }
};

/**
 * This function adds an icon to the DOM based on a specific path.
 * In addition, before added to the DOM, it will customize the icon style.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} path - The path in the DOM where the icon will be added.
 * @param {string} icon - The icon that will be added to the DOM - can be an icon id or codepoint for twemoji.
 */
export const addToDOM = (plugin: IconFolderPlugin, path: string, icon: string, color?: string): void => {
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

  insertIconToNode(plugin, icon, iconNode, color);

  node.insertBefore(iconNode, titleNode);
};

/**
 * This function inserts a specific icon into the specified node.
 *
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {string} icon - The icon string (can be an icon id or a unicode for twemoji).
 * @param {HTMLElement} node - The element where the icon will be inserted.
 * @param color
 */
export const insertIconToNode = (plugin: IconFolderPlugin, icon: string, node: HTMLElement, color?: string): void => {
  const iconNextIdentifier = nextIdentifier(icon);
  const possibleIcon = getSvgFromLoadedIcon(icon.substring(0, iconNextIdentifier), icon.substring(iconNextIdentifier));

  if (possibleIcon) {
    let iconContent = customizeIconStyle(plugin, possibleIcon, node);
    if (color) {
      iconContent = colorizeIcon(possibleIcon, color);
    }
    node.innerHTML = iconContent;
  } else {
    const emoji = twemoji.parse(icon, {
      folder: 'svg',
      ext: '.svg',
      attributes: () => ({
        width: '16px',
        height: '16px',
      }),
    }) as any;
    node.innerHTML = customizeIconStyle(plugin, emoji, node);
  }
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
      updateIcon(plugin, f);
    }
  });
};

export const isEmoji = (str: string): boolean => {
  const ranges = [
    '(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])', // U+1F680 to U+1F6FF
  ];

  if (str.match(ranges.join('|'))) {
    return true;
  } else {
    return false;
  }
};

export const getIconsInData = (plugin: IconFolderPlugin): string[] => {
  const result: string[] = [];

  Object.entries(plugin.getData()).forEach(([key, value]) => {
    if (key === 'settings') {
      const rules = (value as IconFolderSettings).rules;
      rules.forEach((rule: CustomRule) => {
        if (!isEmoji(rule.icon)) {
          result.push(rule.icon);
        }
      });
    } else if (key !== 'settings' && key !== 'migrated') {
      if (typeof value === 'string' && !isEmoji(value)) {
        result.push(value);
      } else if (typeof value === 'object') {
        const v = value as FolderIconObject;
        if (v.iconName !== null && !isEmoji(v.iconName)) {
          result.push(v.iconName);
        }
        if (v.inheritanceIcon !== null && !isEmoji(v.inheritanceIcon)) {
          result.push(v.inheritanceIcon);
        }
      }
    }
  });

  return result;
};

export const readFileSync = async (file: File): Promise<string> => {
  const content = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (readerEvent) => resolve(readerEvent.target.result as string);
  });

  return content;
};

export const getIconByPath = (plugin: IconFolderPlugin, filePath: string): string | undefined => {
  if (filePath !== 'settings' && filePath !== 'migrated') {
    const value = plugin.getData()[filePath];
    if (typeof value === 'string' && !isEmoji(value)) {
      return value;
    } else if (typeof value === 'object') {
      const v = value as FolderIconObject;
      if (v.iconName !== null && !isEmoji(v.iconName)) {
        return v.iconName;
      }
      if (v.inheritanceIcon !== null && !isEmoji(v.inheritanceIcon)) {
        return v.inheritanceIcon;
      }
    }
  }

  const rules = (plugin.getData()['settings'] as IconFolderSettings)?.rules;
  const rule = rules.find((rule: CustomRule) => !isEmoji(rule.icon) && doesCustomRuleIconExists(rule, filePath));
  if (rule) {
    return rule.icon;
  }

  return undefined;
};

export const getIconsWithPathInData = (plugin: IconFolderPlugin) => {
  const result: { key: string; value: string }[] = [];
  Object.entries(plugin.getData()).forEach(([key, value]: [string, string | FolderIconObject]) => {
    if (key !== 'settings' && key !== 'migrated') {
      if (typeof value === 'string') {
        if (!isEmoji(value)) {
          result.push({ key, value });
          return;
        }
      }

      if (typeof value === 'object') {
        if (value.iconName !== null && !isEmoji(value.iconName)) {
          result.push({ key, value: value.iconName });
          return;
        }
        if (value.inheritanceIcon !== null && !isEmoji(value.inheritanceIcon)) {
          result.push({ key, value: value.inheritanceIcon });
          return;
        }
      }
    }
  });

  return result;
};
