import { TFile } from 'obsidian';
import IconFolderPlugin, { FolderIconObject } from '../main';
import customRule from './customRule';
import dom from './util/dom';
import { DEFAULT_FILE_ICON, getAllOpenedFiles } from '../util';
import { TabHeaderLeaf } from '../@types/obsidian';

const getTabLeafOfFilePath = (
  plugin: IconFolderPlugin,
  path: string,
): TabHeaderLeaf | undefined => {
  const openedFiles = getAllOpenedFiles(plugin);
  const openedFile = openedFiles.find((openedFile) => openedFile.path === path);
  return openedFile?.leaf as TabHeaderLeaf | undefined;
};

interface AddOptions {
  iconName?: string;
  iconColor?: string;
}

const add = async (
  plugin: IconFolderPlugin,
  file: TFile,
  iconContainer: HTMLElement,
  options?: AddOptions,
): Promise<void> => {
  const iconColor = options?.iconColor ?? plugin.getSettings().iconColor;
  const data = Object.entries(plugin.getData());

  // Removes the `display: none` from the obsidian styling.
  iconContainer.style.display = 'flex';

  // Only add the icon name manually when it is defined in the options.
  if (options?.iconName) {
    dom.setIconForNode(plugin, options.iconName, iconContainer, iconColor);
    // TODO: Refactor to include option to `insertIconToNode` function.
    iconContainer.style.margin = null;
    return;
  }

  // Files can also have custom icons inside of inheritance folders.
  const hasIcon = plugin.getData()[file.path];
  if (!hasIcon) {
    // Add icons to tabs if there is some sort of inheritance going on.
    const inheritanceData = data.filter(
      ([key, value]) => typeof value === 'object' && key !== 'settings',
    ) as [string, FolderIconObject][];
    for (const [inheritancePath, inheritance] of inheritanceData) {
      if (!inheritance.inheritanceIcon) {
        continue;
      }

      if (!file.path.includes(inheritancePath)) {
        continue;
      }

      dom.setIconForNode(
        plugin,
        inheritance.inheritanceIcon,
        iconContainer,
        iconColor,
      );
      // TODO: Refactor to include option to `insertIconToNode` function.
      iconContainer.style.margin = null;
      break;
    }
  }

  // Add icons to tabs if a custom rule is applicable.
  for (const rule of customRule.getSortedRules(plugin)) {
    const isApplicable = await customRule.isApplicable(plugin, rule, file);
    if (isApplicable) {
      dom.setIconForNode(plugin, rule.icon, iconContainer, rule.color);
      // TODO: Refactor to include option to `insertIconToNode` function.
      iconContainer.style.margin = null;
      break;
    }
  }

  // Add icons to tabs if there is an icon set.
  const iconData = data.find(([dataPath]) => dataPath === file.path);
  // Check if data was not found or name of icon is not a string.
  if (!iconData || typeof iconData[1] !== 'string') {
    return;
  }

  dom.setIconForNode(plugin, iconData[1], iconContainer, iconColor);
  // TODO: Refactor to include option to `insertIconToNode` function.
  iconContainer.style.margin = null;
};

const update = (
  plugin: IconFolderPlugin,
  iconName: string,
  iconContainer: HTMLElement,
) => {
  dom.setIconForNode(plugin, iconName, iconContainer);
  // TODO: Refactor to include option to `insertIconToNode` function.
  iconContainer.style.margin = null;
};

interface RemoveOptions {
  /**
   * Replaces the icon in the tab with the default obsidian icon.
   */
  replaceWithDefaultIcon?: boolean;
}

const remove = (iconContainer: HTMLElement, options?: RemoveOptions) => {
  if (!options?.replaceWithDefaultIcon) {
    // Removes the display of the icon container to remove the icons from the tabs.
    iconContainer.style.display = 'none';
  } else {
    iconContainer.innerHTML = DEFAULT_FILE_ICON;
  }
};

export default {
  add,
  update,
  remove,
  getTabLeafOfFilePath,
};
