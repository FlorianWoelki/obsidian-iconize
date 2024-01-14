import { TFile } from 'obsidian';
import IconFolderPlugin from '@app/main';
import { DEFAULT_FILE_ICON, getAllOpenedFiles } from '@app/util';
import { TabHeaderLeaf } from '@app/@types/obsidian';
import customRule from './custom-rule';
import dom from './util/dom';

/**
 * Gets the tab leaves of a specific file path by looping through all opened files and
 * checking if the file path matches.
 * @param plugin IconFolderPlugin instance.
 * @param path String of the file path to get the tab leaf of.
 * @returns TabHeaderLeaf array that includes all tab leaves of the file path.
 */
const getTabLeavesOfFilePath = (
  plugin: IconFolderPlugin,
  path: string,
): TabHeaderLeaf[] => {
  const openedFiles = getAllOpenedFiles(plugin);
  const openedFile = openedFiles.filter(
    (openedFile) => openedFile.path === path,
  );
  const leaves = openedFile.map((openedFile) => openedFile.leaf);
  return leaves as TabHeaderLeaf[];
};

interface AddOptions {
  /**
   * Name of the icon to add to the tab.
   * @default undefined
   */
  iconName?: string;
  /**
   * Color of the icon to add to the tab.
   * @default undefined
   */
  iconColor?: string;
}

/**
 * Adds an icon to the tab and its container. This function respects the
 * custom rules and individually icon set.
 * @param plugin IconFolderPlugin instance.
 * @param file TFile instance of the file to add the icon to.
 * @param iconContainer HTMLElement where the icon will be added to.
 * @param options AddOptions for the add function which can optionally be used.
 */
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

/**
 * Updates the icon in the tab and container by setting calling the `setIconForNode`
 * function and removing the margin from the icon container.
 * @param plugin IconFolderPlugin instance.
 * @param iconName String of the icon name to update to.
 * @param iconContainer HTMLElement where the icon is located and will be updated.
 */
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
   * @default false
   */
  replaceWithDefaultIcon?: boolean;
}

/**
 * Removes the icon from the tab and container by setting the `display` style property
 * to `none`. Optionally, the icon can be replaced with the default obsidian icon.
 * @param iconContainer HTMLElement where the icon is located and will be removed from.
 * @param options RemoveOptions for the remove function which can optionally be used.
 */
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
  getTabLeavesOfFilePath,
};
