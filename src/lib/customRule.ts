import { Plugin, TAbstractFile } from 'obsidian';
import emoji from '../emoji';
import IconFolderPlugin from '../main';
import { CustomRule } from '../settings/data';
import dom from './util/dom';
import { getFileItemTitleEl } from '../util';
import config from '../config';

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
 * @param file TAbstractFile to check against the custom rule.
 * @returns Promise that resolves to `true` if the file matches the rule, `false` otherwise.
 */
const isApplicable = async (
  plugin: Plugin,
  rule: CustomRule,
  file: TAbstractFile,
): Promise<boolean> => {
  const metadata = await plugin.app.vault.adapter.stat(file.path);
  if (!metadata) {
    return false;
  }

  const fileType = metadata.type;
  const toMatch = rule.useFilePath ? file.path : file.name;

  const doesMatch = doesMatchFileType(rule, fileType);

  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (!toMatch.match(regex)) {
      return false;
    }

    return doesMatch;
  } catch {
    // Rule is not in some sort of regex, check for basic string match.
    return toMatch.includes(rule.rule) && doesMatch;
  }
};

/**
 * Removes the icon from the custom rule from all the files and folders, if applicable.
 * @param plugin IconFolderPlugin instance.
 * @param rule CustomRule where the icons will be removed based on this rule.
 */
const removeFromAllFiles = async (
  plugin: IconFolderPlugin,
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
    if (doesExistInPath(rule, dataPath) && doesMatchFileType(rule, fileType)) {
      dom.removeIconInNode(parent);
    }
  }
};

/**
 * Gets all the custom rules sorted by their order property in ascending order.
 * @param plugin IconFolderPlugin instance.
 * @returns CustomRule array sorted by their order property in ascending order.
 */
const getSortedRules = (plugin: IconFolderPlugin): CustomRule[] => {
  return plugin.getSettings().rules.sort((a, b) => a.order - b.order);
};

/**
 * Tries to apply all custom rules to all files. This function iterates over all the saved
 * custom rules and calls {@link addToAllFiles}.
 * @param plugin Instance of the IconFolderPlugin.
 */
const addAll = async (plugin: IconFolderPlugin): Promise<void> => {
  for (const rule of getSortedRules(plugin)) {
    await addToAllFiles(plugin, rule);
  }
};

/**
 * Tries to add all specific custom rule icon to all registered files. It does that by
 * calling the {@link add} function. Furthermore, it also checks whether the file or folder
 * already has an icon. Custom rules should have the lowest priority and will get ignored
 * if an icon already exists in the file or folder.
 * @param plugin Instance of the IconFolderPlugin.
 * @param rule Custom rule that will be applied, if applicable, to all files.
 */
const addToAllFiles = async (
  plugin: IconFolderPlugin,
  rule: CustomRule,
): Promise<void> => {
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const files = Object.values(fileExplorer.fileItems);
    for (const fileItem of files) {
      await add(plugin, rule, fileItem.file, getFileItemTitleEl(fileItem));
    }
  }
};

/**
 * Tries to add the icon of the custom rule to a file or folder. This function also checks
 * if the file type matches the `for` property of the custom rule.
 * @param plugin Instance of the IconFolderPlugin.
 * @param rule Custom rule that will be used to check if the rule is applicable to the file.
 * @param file File or folder that will be used to possibly create the icon for.
 * @param container Optional element where the icon will be added if the custom rules matches.
 * @returns A promise that resolves to true if the icon was added, false otherwise.
 */
const add = async (
  plugin: IconFolderPlugin,
  rule: CustomRule,
  file: TAbstractFile,
  container?: HTMLElement,
): Promise<boolean> => {
  if (container && dom.doesElementHasIconNode(container)) {
    return false;
  }

  // Gets the type of the file.
  const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;

  const hasIcon = plugin.getIconNameFromPath(file.path);
  if (!doesMatchFileType(rule, fileType) || hasIcon) {
    return false;
  }
  const toMatch = rule.useFilePath ? file.path : file.name;
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (toMatch.match(regex)) {
      dom.createIconNode(plugin, file.path, rule.icon, {
        color: rule.color,
        container,
      });
      return true;
    }
  } catch {
    // Rule is not applicable to a regex format.
    if (toMatch.includes(rule.rule)) {
      dom.createIconNode(plugin, file.path, rule.icon, {
        color: rule.color,
        container,
      });
      return true;
    }
  }

  return false;
};

/**
 * Determines whether a given rule exists in a given path.
 * @param rule Rule to check for.
 * @param path Path to check in.
 * @returns True if the rule exists in the path, false otherwise.
 */
const doesExistInPath = (rule: CustomRule, path: string): boolean => {
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
 * Gets a custom rule by its path.
 * @param plugin Instance of the plugin.
 * @param path Path to check for.
 * @returns The custom rule if it exists, undefined otherwise.
 */
const getByPath = (
  plugin: IconFolderPlugin,
  path: string,
): CustomRule | undefined => {
  if (path === 'settings' || path === 'migrated') {
    return undefined;
  }

  return getSortedRules(plugin).find(
    (rule) => !emoji.isEmoji(rule.icon) && doesExistInPath(rule, path),
  );
};

/**
 * Gets all the files and directories that can be applied to the specific custom rule.
 * @param plugin Instance of IconFolderPlugin.
 * @param rule Custom rule that will be checked for.
 * @returns An array of files and directories that match the custom rule.
 */
const getFiles = (
  plugin: IconFolderPlugin,
  rule: CustomRule,
): TAbstractFile[] => {
  const result: TAbstractFile[] = [];
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const files = Object.values(fileExplorer.fileItems);
    for (const fileItem of files) {
      if (doesExistInPath(rule, fileItem.file.path)) {
        result.push(fileItem.file);
      }
    }
  }
  return result;
};

export default {
  getFiles,
  doesExistInPath,
  doesMatchFileType,
  getSortedRules,
  getByPath,
  removeFromAllFiles,
  add,
  addAll,
  addToAllFiles,
  isApplicable,
};
