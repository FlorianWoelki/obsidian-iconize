import { TFile } from 'obsidian';
import IconFolderPlugin, { FolderIconObject } from '../main';
import customRule from './customRule';
import dom from './dom';

/**
 * Get all icon containers of all open tabs. The icon container mostly relies next to the
 * element with the actual name of the file.
 * @param filename String that will be used to get the icon container.
 * @returns An array of HTMLElement of the icon containers.
 */
const getIconContainers = (filename: string): HTMLElement[] => {
  // Gets all tab header elements with the `aria-label` attribute.
  const nodes = document.querySelectorAll(`[aria-label="${filename}"]`);
  const containers: HTMLElement[] = [];
  nodes.forEach((node) => {
    if (!node.hasAttribute('draggable') || node.children.length === 0) {
      return;
    }

    // Gets the inner header container of the tab.
    const headerInnerContainer = node.children[0];
    if (!headerInnerContainer || headerInnerContainer.children.length === 0) {
      return;
    }

    // Gets the icon container inside of the inner header container.
    const iconContainer = headerInnerContainer.children[0] as HTMLElement | undefined;
    if (!iconContainer) {
      return;
    }

    containers.push(iconContainer);
  });

  return containers;
};

interface AddOptions {
  iconName?: string;
  iconColor?: string;
}

const add = async (plugin: IconFolderPlugin, file: TFile, options?: AddOptions): Promise<void> => {
  const iconContainers = getIconContainers(file.basename);
  if (iconContainers.length === 0) {
    return;
  }

  const iconColor = options?.iconColor ?? plugin.getSettings().iconColor;
  const data = Object.entries(plugin.getData());

  for (const iconContainer of iconContainers) {
    // Removes the `display: none` from the obsidian styling.
    iconContainer.style.display = 'flex';

    // Only add the icon name manually when it is defined in the options.
    if (options?.iconName) {
      dom.setIconForNode(plugin, options.iconName, iconContainer, iconColor);
      // TODO: Refactor to include option to `insertIconToNode` function.
      iconContainer.style.margin = null;
      continue;
    }

    // Files can also have custom icons inside of inheritance folders.
    const hasIcon = plugin.getData()[file.path];
    if (!hasIcon) {
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

        dom.setIconForNode(plugin, inheritance.inheritanceIcon, iconContainer, iconColor);
        // TODO: Refactor to include option to `insertIconToNode` function.
        iconContainer.style.margin = null;
        break;
      }
    }

    // Add icons to tabs if a custom rule is applicable.
    for (const rule of plugin.getSettings().rules) {
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
      continue;
    }

    dom.setIconForNode(plugin, iconData[1], iconContainer, iconColor);
    // TODO: Refactor to include option to `insertIconToNode` function.
    iconContainer.style.margin = null;
  }
};

const update = (plugin: IconFolderPlugin, file: TFile, iconName: string) => {
  const iconContainers = getIconContainers(file.basename);
  if (iconContainers.length === 0) {
    return;
  }

  for (const iconContainer of iconContainers) {
    dom.setIconForNode(plugin, iconName, iconContainer);
    // TODO: Refactor to include option to `insertIconToNode` function.
    iconContainer.style.margin = null;
  }
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
  const iconContainers = getIconContainers(file.basename);
  if (iconContainers.length === 0) {
    return;
  }

  for (const iconContainer of iconContainers) {
    if (!options?.replaceWithDefaultIcon) {
      // Removes the display of the icon container to remove the icons from the tabs.
      iconContainer.style.display = 'none';
    } else {
      iconContainer.innerHTML = DEFAULT_ICON;
    }
  }
};

export default {
  add,
  update,
  remove,
};
