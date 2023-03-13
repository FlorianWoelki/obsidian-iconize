import emoji from '../emoji';
import IconFolderPlugin, { FolderIconObject } from '../main';
import customRule from './customRule';
import inheritance from './inheritance';

const getByPath = (plugin: IconFolderPlugin, path: string): string | undefined => {
  if (path !== 'settings' && path !== 'migrated') {
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

export default {
  getByPath,
};
