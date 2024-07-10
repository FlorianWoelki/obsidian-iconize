import { ExplorerView, TabHeaderLeaf } from '@app/@types/obsidian';
import emoji from '@app/emoji';
import IconizePlugin, { FolderIconObject } from '@app/main';
import customRule from './custom-rule';
import dom from './util/dom';
import iconTabs from './icon-tabs';
import { getFileItemInnerTitleEl, getFileItemTitleEl } from '@app/util';
import {
  Icon,
  extractIconToIconPack,
  getAllIconPacks,
  getIconFromIconPack,
  getIconPackNameByPrefix,
  getNormalizedName,
  getPath,
  getSvgFromLoadedIcon,
  nextIdentifier,
} from '@app/icon-pack-manager';
import config from '@app/config';
import { Notice } from 'obsidian';
import { IconCache } from './icon-cache';
import { logger } from './logger';

const checkMissingIcons = async (
  plugin: IconizePlugin,
  data: [string, string | FolderIconObject][],
): Promise<void> => {
  const missingIcons: Set<Icon> = new Set();
  const allIcons: Map<string, boolean> = new Map();

  const getMissingIcon = async (
    iconNameWithPrefix: string,
  ): Promise<Icon | null> => {
    const iconNextIdentifier = nextIdentifier(iconNameWithPrefix);
    const iconName = iconNameWithPrefix.substring(iconNextIdentifier);
    const iconPrefix = iconNameWithPrefix.substring(0, iconNextIdentifier);
    const iconPackName = getIconPackNameByPrefix(iconPrefix);

    if (!plugin.getSettings().useCustomLucideIconPack) {
      return;
    }

    const icon = getIconFromIconPack(iconPackName, iconPrefix, iconName);
    if (!icon) {
      logger.error(
        `Icon file with name ${iconNameWithPrefix} could not be found`,
      );
      return null;
    }

    const doesIconFileExists = await plugin.app.vault.adapter.exists(
      `${getPath()}/${iconPackName}/${iconName}.svg`,
    );

    if (!doesIconFileExists) {
      const possibleIcon = getSvgFromLoadedIcon(iconPrefix, iconName);
      if (!possibleIcon) {
        logger.error(
          `Icon SVG with name ${iconNameWithPrefix} could not be found`,
        );
        return null;
      }

      await extractIconToIconPack(plugin, icon, possibleIcon);
      return icon;
    }

    return null;
  };

  for (const rule of plugin.getSettings().rules) {
    if (!emoji.isEmoji(rule.icon)) {
      allIcons.set(rule.icon, true);

      const icon = await getMissingIcon(rule.icon);
      if (icon) {
        missingIcons.add(icon);
      }
    }
  }

  for (const [_, value] of data) {
    // Check for missing icon names.
    let iconNameWithPrefix = value as string;
    if (typeof value === 'object') {
      iconNameWithPrefix = value.iconName;
    }

    if (iconNameWithPrefix && !emoji.isEmoji(iconNameWithPrefix)) {
      allIcons.set(iconNameWithPrefix, true);

      const icon = await getMissingIcon(iconNameWithPrefix);
      if (icon) {
        missingIcons.add(icon);
      }
    }
  }

  // Show notice that background check is running.
  if (missingIcons.size !== 0) {
    new Notice(
      `[${config.PLUGIN_NAME}] Background Check: found missing icons. Adding missing icons...`,
      10000,
    );
  }

  // Iterates over all the missing icons with its path and adds the icon to the node.
  for (const icon of missingIcons) {
    const normalizedName = getNormalizedName(icon.prefix + icon.name);
    const nodesWithIcon = document.querySelectorAll(
      `[${config.ICON_ATTRIBUTE_NAME}="${normalizedName}"]`,
    );

    nodesWithIcon.forEach((node: HTMLElement) => {
      dom.setIconForNode(plugin, normalizedName, node);
    });
  }

  // Show notice that background check was finished.
  if (missingIcons.size !== 0) {
    new Notice(
      `[${config.PLUGIN_NAME}] Background Check: added missing icons`,
      10000,
    );
  }

  // Remove all icon files that can not be found in the data.
  for (const iconPack of getAllIconPacks()) {
    // Checks if the icon pack exists.
    const doesIconPackExist = await plugin.app.vault.adapter.exists(
      `${getPath()}/${iconPack.name}`,
    );
    if (!doesIconPackExist) {
      continue;
    }

    const iconFiles = await plugin.app.vault.adapter.list(
      `${getPath()}/${iconPack.name}`,
    );

    for (const iconFilePath of iconFiles.files) {
      const iconNameWithExtension = iconFilePath.split('/').pop();
      // Removes the file extension.
      const iconName = iconNameWithExtension?.substring(
        0,
        iconNameWithExtension.length - 4,
      );

      const iconNameWithPrefix = iconPack.prefix + iconName;
      const doesIconExist = allIcons.get(iconNameWithPrefix);
      if (!doesIconExist) {
        const path = `${getPath()}/${iconPack.name}/${iconName}.svg`;
        const doesPathExist = await plugin.app.vault.adapter.exists(path);
        if (doesPathExist) {
          logger.info(
            `Removing icon with path '${path}' because it is not used anymore`,
          );
          // Removes the icon file.
          await plugin.app.vault.adapter.remove(
            `${getPath()}/${iconPack.name}/${iconName}.svg`,
          );
        }
      }
    }
  }
};

/**
 * This function adds all the possible icons to the corresponding nodes. It
 * adds the icons, that are defined in the data as a basic string to the nodes
 * and the custom rule icons.
 * @param plugin Instance of IconizePlugin.
 * @param data Data that will be used to add all the icons to the nodes.
 * @param registeredFileExplorers A WeakSet of file explorers that are being used as a
 * cache for already handled file explorers.
 * @param callback Callback is being called whenever the icons are added to one file
 * explorer.
 */
const addAll = (
  plugin: IconizePlugin,
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

    // Adds icons to already open file tabs.
    if (plugin.getSettings().iconInTabsEnabled) {
      for (const leaf of plugin.app.workspace.getLeavesOfType('markdown')) {
        const file = leaf.view.file;
        if (file) {
          const tabHeaderLeaf = leaf as TabHeaderLeaf;
          const iconColor = plugin.getIconColor(file.path);
          iconTabs.add(plugin, file, tabHeaderLeaf.tabHeaderInnerIconEl, {
            iconColor,
          });
        }
      }
    }

    for (const [dataPath, value] of data) {
      const fileItem = fileExplorer.view.fileItems[dataPath];
      if (fileItem) {
        const titleEl = getFileItemTitleEl(fileItem);
        const titleInnerEl = getFileItemInnerTitleEl(fileItem);

        // Need to check this because refreshing the plugin will duplicate all the icons.
        if (titleEl.children.length === 2 || titleEl.children.length === 1) {
          const iconName = typeof value === 'string' ? value : value.iconName;
          const iconColor =
            typeof value === 'string' ? undefined : value.iconColor;
          if (iconName) {
            // Removes a possible existing icon.
            const existingIcon = titleEl.querySelector('.iconize-icon');
            if (existingIcon) {
              existingIcon.remove();
            }

            // Creates the new node with the icon inside.
            const iconNode = titleEl.createDiv();
            iconNode.setAttribute(config.ICON_ATTRIBUTE_NAME, iconName);
            iconNode.classList.add('iconize-icon');

            IconCache.getInstance().set(dataPath, {
              iconNameWithPrefix: iconName,
            });
            dom.setIconForNode(plugin, iconName, iconNode, iconColor);

            titleEl.insertBefore(iconNode, titleInnerEl);
          }
        }
      }
    }

    // Callback function to register other events to this file explorer.
    callback?.();
  }

  // Handles the custom rules.
  for (const rule of customRule.getSortedRules(plugin)) {
    customRule.addToAllFiles(plugin, rule);
  }
};

/**
 * Gets the icon of a given path. This function returns the first occurrence of an icon.
 * @param plugin Instance of the IconizePlugin.
 * @param path Path to get the icon of.
 * @returns The icon of the path if it exists, undefined otherwise.
 */
const getByPath = (plugin: IconizePlugin, path: string): string | undefined => {
  if (path === 'settings' || path === 'migrated') {
    return undefined;
  }

  const value = plugin.getData()[path];
  if (typeof value === 'string') {
    // If the value is a plain icon name, return it.
    return value;
  } else if (typeof value === 'object') {
    const v = value as FolderIconObject;
    if (v.iconName !== null) {
      return v.iconName;
    }
  }

  // Tries to get the custom rule for the path and returns its icon if it exists.
  const rule = customRule.getSortedRules(plugin).find((rule) => {
    return customRule.doesMatchPath(rule, path);
  });
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
 * @param plugin Instance of the IconizePlugin.
 * @returns An object that consists of the path and the icon name for the data
 * or custom rule.
 */
const getAllWithPath = (plugin: IconizePlugin): IconWithPath[] => {
  const result: IconWithPath[] = [];
  Object.keys(plugin.getData()).forEach((path) => {
    if (path === 'settings' || path === 'migrated') {
      return;
    }

    const icon = getByPath(plugin, path);
    if (icon && !emoji.isEmoji(icon)) {
      result.push({ path, icon });
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

/**
 * Returns the {@link Icon} for the given icon name. It is important, that the icon name
 * contains the icon pack prefix.
 * @param iconNameWithPrefix String that contains the icon pack prefix combined with the
 * icon name.
 * @returns Icon if it exists, `null` otherwise.
 */
const getIconByName = (iconNameWithPrefix: string): Icon | null => {
  const iconNextIdentifier = nextIdentifier(iconNameWithPrefix);
  const iconName = iconNameWithPrefix.substring(iconNextIdentifier);
  const iconPrefix = iconNameWithPrefix.substring(0, iconNextIdentifier);
  const iconPackName = getIconPackNameByPrefix(iconPrefix);
  const icon = getIconFromIconPack(iconPackName, iconPrefix, iconName);
  if (!icon) {
    return null;
  }

  return icon;
};

/**
 * Returns the {@link Icon} for the given path.
 * @param plugin IconizePlugin instance.
 * @param path String which is the path to get the icon of.
 * @returns Icon or Emoji as string if it exists, `null` otherwise.
 */
const getIconByPath = (
  plugin: IconizePlugin,
  path: string,
): Icon | string | null => {
  const iconNameWithPrefix = getByPath(plugin, path);
  if (!iconNameWithPrefix) {
    return null;
  }

  if (emoji.isEmoji(iconNameWithPrefix)) {
    return iconNameWithPrefix;
  }

  return getIconByName(iconNameWithPrefix);
};

export default {
  addAll,
  getByPath,
  getAllWithPath,
  getIconByPath,
  getIconByName,
  checkMissingIcons,
};
