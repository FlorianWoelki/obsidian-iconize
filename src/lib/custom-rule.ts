import { Plugin, TAbstractFile } from 'obsidian';
import IconizePlugin from '@app/main';
import { CustomRule } from '@app/settings/data';
import { getFileItemTitleEl } from '@app/util';
import config from '@app/config';
import { FileItem } from '@app/@types/obsidian';
import { IconCache } from './icon-cache';
import dom from './util/dom';

export type CustomRuleFileType = 'file' | 'folder';

/**
 * Checks if the file type is equal to the `for` property of the custom rule.
 * @param rule CustomRule that will be checked.
 * @param fileType CustomRuleFileType that will be checked. Can be either `file` or `folder`.
 * @returns Boolean whether the custom rule `for` matches the file type or not.
 */
const doesMatchFileType = (
  rule: CustomRule,
  fileType: CustomRuleFileType,
): boolean => {
  return (
    rule.for === 'everything' ||
    (rule.for === 'files' && fileType === 'file') ||
    (rule.for === 'folders' && fileType === 'folder')
  );
};

/**
 * Determines whether a given file or folder matches a specified custom rule.
 * @param plugin Plugin instance.
 * @param rule CustomRule to check against the file or folder.
 * @param filePath String to check against the custom rule.
 * @returns Promise that resolves to `true` if the file matches the rule, `false` otherwise.
 */
const isApplicable = async (
  plugin: Plugin,
  rule: CustomRule,
  filePath: string,
): Promise<boolean> => {
  const metadata = await plugin.app.vault.adapter.stat(filePath);
  if (!metadata) {
    return false;
  }

  const fileType = metadata.type;

  const doesMatch = doesMatchFileType(rule, fileType);

  if (!doesMatch) {
    return false;
  }

  return doesMatchPath(rule, filePath);
};

/**
 * Removes the icon from the custom rule from all the files and folders, if applicable.
 * @param plugin IconizePlugin instance.
 * @param rule CustomRule where the icons will be removed based on this rule.
 */
const removeFromAllFiles = async (
  plugin: IconizePlugin,
  rule: CustomRule,
): Promise<void> => {
  const nodesWithIcon = document.querySelectorAll(
    `[${config.ICON_ATTRIBUTE_NAME}="${rule.icon}"]`,
  );

  for (let i = 0; i < nodesWithIcon.length; i++) {
    const node = nodesWithIcon[i];
    // Parent element is the node which contains the data path.
    const parent = node.parentElement;
    if (!parent) {
      continue;
    }

    const dataPath = parent.getAttribute('data-path');
    if (!dataPath) {
      continue;
    }

    const fileType = (await plugin.app.vault.adapter.stat(dataPath)).type;
    if (doesMatchPath(rule, dataPath) && doesMatchFileType(rule, fileType)) {
      dom.removeIconInNode(parent);
      IconCache.getInstance().invalidate(dataPath);
    }
  }
};

/**
 * Gets all the custom rules sorted by their order property in ascending order.
 * @param plugin IconizePlugin instance.
 * @returns CustomRule array sorted by their order property in ascending order.
 */
const getSortedRules = (plugin: IconizePlugin): CustomRule[] => {
  return plugin.getSettings().rules.sort((a, b) => a.order - b.order);
};

/**
 * Tries to add all specific custom rule icons to all registered files and directories.
 * It does that by calling the {@link add} function. Custom rules should have the lowest
 * priority and will get ignored if an icon already exists in the file or directory.
 * @param plugin IconizePlugin instance.
 * @param rule CustomRule that will be applied, if applicable, to all files and folders.
 */
const addToAllFiles = async (
  plugin: IconizePlugin,
  rule: CustomRule,
): Promise<void> => {
  const fileItems = await getFileItems(plugin, rule);
  for (const fileItem of fileItems) {
    await add(plugin, rule, fileItem.file, getFileItemTitleEl(fileItem));
  }
};

/**
 * Tries to add the icon of the custom rule to a file or folder. This function also checks
 * if the file type matches the `for` property of the custom rule.
 * @param plugin IconizePlugin instance.
 * @param rule CustomRule that will be used to check if the rule is applicable to the file
 * or directory.
 * @param file TAbstractFile that will be used to possibly create the icon for.
 * @param container HTMLElement where the icon will be added if the custom rules matches.
 * @returns A promise that resolves to `true` if the icon was added, `false` otherwise.
 */
const add = async (
  plugin: IconizePlugin,
  rule: CustomRule,
  file: TAbstractFile,
  container?: HTMLElement,
): Promise<boolean> => {
  if (container && dom.doesElementHasIconNode(container)) {
    return false;
  }

  // Checks if the file or directory already has an icon.
  const hasIcon = plugin.getIconNameFromPath(file.path);
  if (hasIcon) {
    return false;
  }

  const doesMatch = await isApplicable(plugin, rule, file.path);
  if (doesMatch) {
    IconCache.getInstance().set(file.path, {
      iconNameWithPrefix: rule.icon,
      inCustomRule: true,
    });
    dom.createIconNode(plugin, file.path, rule.icon, {
      color: rule.color,
      container,
    });
    return true;
  }

  return false;
};

/**
 * Determines whether a given rule exists in a given path.
 * @param rule Rule to check for.
 * @param path Path to check in.
 * @returns True if the rule exists in the path, false otherwise.
 */
const doesMatchPath = (rule: CustomRule, path: string): boolean => {
  const toMatch = rule.useFilePath ? path : path.split('/').pop();
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (toMatch.match(regex)) {
      return true;
    }
  } catch {
    // Rule is not in some sort of regex, check for basic string match.
    return toMatch.includes(rule.rule);
  }

  return false;
};

/**
 * Gets all the file items that can be applied to the specific custom rule.
 * @param plugin Instance of IconizePlugin.
 * @param rule Custom rule that will be checked for.
 * @returns A promise that resolves to an array of file items that match the custom rule.
 */
const getFileItems = async (
  plugin: IconizePlugin,
  rule: CustomRule,
): Promise<FileItem[]> => {
  const result: FileItem[] = [];
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const files = Object.values(fileExplorer.fileItems || {});
    for (const fileItem of files) {
      if (await isApplicable(plugin, rule, fileItem.file.path)) {
        result.push(fileItem);
      }
    }
  }
  return result;
};

export default {
  getFileItems,
  doesMatchPath,
  doesMatchFileType,
  getSortedRules,
  removeFromAllFiles,
  add,
  addToAllFiles,
  isApplicable,
};
