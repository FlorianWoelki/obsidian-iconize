import { ExplorerView } from '../@types/obsidian';
import emoji from '../emoji';
import IconFolderPlugin, { FolderIconObject } from '../main';
import customRule from './customRule';
import dom from './util/dom';
import iconTabs from './iconTabs';
import inheritance from './inheritance';

/**
 * This function adds all the possible icons to the corresponding nodes. It adds the icons,
 * that are defined in the data as a basic string to the nodes, the inheritance folder
 * icons, and also the custom rule icons.
 * @param plugin Instance of IconFolderPlugin.
 * @param data Data that will be used to add all the icons to the nodes.
 * @param registeredFileExplorers A WeakSet of file explorers that are being used as a
 * cache for already handled file explorers.
 * @param callback Callback is being called whenever the icons are added to one file
 * explorer.
 */
export const addAll = (
  plugin: IconFolderPlugin,
  data: [string, string | FolderIconObject][],
  registeredFileExplorers: WeakSet<ExplorerView>,
  callback?: () => void,
): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  for (const fileExplorer of fileExplorers) {
    if (registeredFileExplorers.has(fileExplorer.view)) {
      continue;
    }

    registeredFileExplorers.add(fileExplorer.view);

    // create a map with registered file paths to have constant look up time
    const registeredFilePaths: Record<string, boolean> = {};
    for (const [path] of data) {
      registeredFilePaths[path] = true;
    }

    for (const [dataPath, value] of data) {
      const fileItem = fileExplorer.view.fileItems[dataPath];
      if (fileItem) {
        const titleEl = dom.getFileItemTitleEl(fileItem);
        const titleInnerEl = dom.getFileItemInnerTitleEl(fileItem);

        // Need to check this because refreshing the plugin will duplicate all the icons.
        if (titleEl.children.length === 2 || titleEl.children.length === 1) {
          // Gets the icon name directly or from the inheritance folder.
          const iconName = typeof value === 'string' ? value : value.iconName;
          if (iconName) {
            // Removes a possible existing icon.
            const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
            if (existingIcon) {
              existingIcon.remove();
            }

            // Creates the new node with the icon inside.
            const iconNode = titleEl.createDiv();
            iconNode.classList.add('obsidian-icon-folder-icon');

            dom.setIconForNode(plugin, iconName, iconNode);

            titleEl.insertBefore(iconNode, titleInnerEl);
          }

          // Handle possible inheritance for the folder.
          if (typeof value === 'object' && value.inheritanceIcon) {
            inheritance.add(plugin, dataPath, value.inheritanceIcon);
          }
        }
      }
    }

    // Callback function to register other events to this file explorer.
    callback?.();
  }

  // Handles the custom rules.
  customRule.addAll(plugin);

  // Adds icons to already open file tabs.
  if (plugin.getSettings().iconInTabsEnabled) {
    for (const leaf of plugin.app.workspace.getLeavesOfType('markdown')) {
      const file = leaf.view.file;
      if (file) {
        iconTabs.add(plugin, file);
      }
    }
  }
};

/**
 * Gets the icon of a given path. This function returns the first occurrence of an icon.
 * @param plugin Instance of the IconFolderPlugin.
 * @param path Path to get the icon of.
 * @returns The icon of the path if it exists, undefined otherwise.
 */
const getByPath = (plugin: IconFolderPlugin, path: string): string | undefined => {
  if (path === 'settings' || path === 'migrated') {
    return undefined;
  }

  const value = plugin.getData()[path];
  if (typeof value === 'string' && !emoji.isEmoji(value)) {
    // If the value is a plain icon name, return it.
    return value;
  } else if (typeof value === 'object') {
    // Additional checks for inheritance folders.
    const v = value as FolderIconObject;
    // If the inheritance folder contains a custom icon for itself, return it.
    if (v.iconName !== null && !emoji.isEmoji(v.iconName)) {
      return v.iconName;
    }
  }

  // Tries to get the inheritance icon for the path and returns its inheritance icon if
  // it exists.
  const inheritanceIcon = inheritance.getByPath(plugin, path);
  if (inheritanceIcon) {
    return inheritanceIcon.inheritanceIcon;
  }

  // Tries to get the custom rule for the path and returns its icon if it exists.
  const rule = customRule.getByPath(plugin, path);
  if (rule) {
    return rule.icon;
  }

  return undefined;
};

interface IconWithPath {
  path: string;
  icon: string;
}

/**
 * Gets all the icons with their paths as an object.
 * @param plugin Instance of the IconFolderPlugin.
 * @returns An object that consists of the path and the icon name for the data, inheritance,
 * or custom rule.
 */
const getAllWithPath = (plugin: IconFolderPlugin): IconWithPath[] => {
  const result: IconWithPath[] = [];
  Object.keys(plugin.getData()).forEach((path) => {
    if (path === 'settings' || path === 'migrated') {
      return;
    }

    const icon = getByPath(plugin, path);
    if (icon && !emoji.isEmoji(icon)) {
      result.push({ path, icon });
    }

    // Check for inheritance folder and insert the inheritance icon.
    const inheritanceFolder = inheritance.getByPath(plugin, path);
    if (inheritanceFolder && !emoji.isEmoji(inheritanceFolder.inheritanceIcon)) {
      result.push({ path, icon: inheritanceFolder.inheritanceIcon });
    }
  });

  // Add all icons for the custom rules with the rule as the path.
  for (const rule of plugin.getSettings().rules) {
    if (!emoji.isEmoji(rule.icon)) {
      result.push({ path: rule.rule, icon: rule.icon });
    }
  }
  return result;
};

export default {
  addAll,
  getByPath,
  getAllWithPath,
};
