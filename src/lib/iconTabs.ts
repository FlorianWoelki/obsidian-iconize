import { TFile } from 'obsidian';
import { getSvgFromLoadedIcon, nextIdentifier } from '../iconPackManager';
import IconFolderPlugin, { FolderIconObject } from '../main';
import { insertIconToNode } from '../util';
import customRule from './customRule';

/**
 * Gets the icon container inside of a tab. The icon container mostly relies next to the
 * element with the actual name of the file.
 * @param filename String that will be used to get the icon container.
 * @returns HTMLElement when the icon container was found or undefined when not.
 */
const getIconContainer = (filename: string): HTMLElement | undefined => {
  // Checks if tab header element exists with the `aria-label` attribute.
  const node = document.querySelector(`[aria-label="${filename}"]`);
  if (!node || !node.hasAttribute('draggable') || node.children.length === 0) {
    return undefined;
  }

  // Gets the inner header container of the tab.
  const headerInnerContainer = node.children[0];
  if (!headerInnerContainer || headerInnerContainer.children.length === 0) {
    return undefined;
  }

  // Gets the icon container inside of the inner header container.
  const iconContainer = headerInnerContainer.children[0] as HTMLElement | undefined;
  if (!iconContainer) {
    return undefined;
  }

  return iconContainer;
};

const add = async (plugin: IconFolderPlugin, file: TFile): Promise<void> => {
  const iconContainer = getIconContainer(file.basename);
  if (!iconContainer) {
    return;
  }

  const data = Object.entries(plugin.getData());

  // Removes the `display: none` from the obsidian styling.
  iconContainer.style.display = 'flex';

  // Add icons to tabs if there is some sort of inheritance going on.
  const inheritanceData = data.filter(([key, value]) => typeof value === 'object' && key !== 'settings') as [
    string,
    FolderIconObject,
  ][];
  for (const [inheritancePath, inheritance] of inheritanceData) {
    if (!inheritance.inheritanceIcon) {
      continue;
    }

    if (!file.path.includes(inheritancePath)) {
      continue;
    }

    insertIconToNode(plugin, inheritance.inheritanceIcon, iconContainer);
    break;
  }

  // Add icons to tabs if a custom rule is applicable.
  for (const rule of plugin.getSettings().rules) {
    const isApplicable = await customRule.isApplicable(plugin, rule, file);
    if (isApplicable) {
      insertIconToNode(plugin, rule.icon, iconContainer);
      break;
    }
  }

  // Add icons to tabs if there is an icon set.
  const iconData = data.find(([dataPath]) => dataPath === file.path);
  // Check if data was not found or name of icon is not a string.
  if (!iconData || typeof iconData[1] !== 'string') {
    return;
  }

  insertIconToNode(plugin, iconData[1], iconContainer);
};

const update = (file: TFile, iconName: string) => {
  const iconContainer = getIconContainer(file.basename);
  if (!iconContainer) {
    return;
  }

  // insertIconToNode(plugin, iconName, iconContainer)
};

// Default icon for tabs of obsidian.
const DEFAULT_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';

interface RemoveOptions {
  /**
   * Replaces the icon in the tab with the default obsidian icon.
   */
  replaceWithDefaultIcon?: boolean;
}

const remove = (file: TFile, options?: RemoveOptions) => {
  const iconContainer = getIconContainer(file.basename);
  if (!iconContainer) {
    return;
  }

  if (!options?.replaceWithDefaultIcon) {
    // Removes the display of the icon container to remove the icons from the tabs.
    iconContainer.style.display = 'none';
  } else {
    iconContainer.innerHTML = DEFAULT_ICON;
  }
};

export default {
  add,
  update,
  remove,
};
