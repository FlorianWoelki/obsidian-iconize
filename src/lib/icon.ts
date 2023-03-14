import emoji from '../emoji';
import IconFolderPlugin, { FolderIconObject } from '../main';
import customRule from './customRule';
import inheritance from './inheritance';

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

  // Checks if the path has an icon.
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
 * @returns An object that consists of the paths as the keys and the values as the
 * icon names.
 */
const getAllWithPath = (plugin: IconFolderPlugin): IconWithPath[] => {
  const result: IconWithPath[] = [];
  Object.keys(plugin.getData()).forEach((path) => {
    if (path === 'settings' || path === 'migrated') {
      return;
    }

    const icon = getByPath(plugin, path);
    if (icon) {
      result.push({ path, icon });
    }

    // Check again for custom rule because `getByPath` only returns the first occurrence.
    // TODO: Need to refactor this.
    const rule = customRule.getByPath(plugin, path);
    if (rule) {
      result.push({ path, icon: rule.icon });
    }
  });
  return result;
};

export default {
  getByPath,
  getAllWithPath,
};
