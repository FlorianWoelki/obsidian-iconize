import { TAbstractFile } from 'obsidian';
import emoji from '../emoji';
import IconFolderPlugin, { FolderIconObject } from '../main';
import { CustomRule, IconFolderSettings } from '../settings-data';
import dom from './util/dom';

export type CustomRuleFileType = 'file' | 'folder';

/**
 * Checks if the file type is equal to the `for` property of the custom rule.
 * @param rule Custom rule that will be checked.
 * @param fileType File type that will be checked.
 * @returns Boolean whether the custom rule `for` matches the file type or not.
 */
const doesMatchFileType = (rule: CustomRule, fileType: CustomRuleFileType): boolean => {
  return (
    rule.for === 'everything' ||
    (rule.for === 'files' && fileType === 'file') ||
    (rule.for === 'folders' && fileType === 'folder')
  );
};

/**
 * Determines whether a given file matches a specified custom rule.
 * @param plugin Plugin object containing the app and other plugin data.
 * @param rule Custom rule to check against the file.
 * @param file File to check against the custom rule.
 * @returns A promise that resolves to true if the file matches the rule, false otherwise.
 */
const isApplicable = async (plugin: IconFolderPlugin, rule: CustomRule, file: TAbstractFile): Promise<boolean> => {
  // Gets the file type based on the specified file path.
  const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;

  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (!file.name.match(regex)) {
      return false;
    }

    return doesMatchFileType(rule, fileType);
  } catch {
    // Rule is not in some sort of regex, check for basic string match.
    return file.name.includes(rule.rule) && doesMatchFileType(rule, fileType);
  }
};

/**
 * Removes the icon from the custom rule from all the files, if applicable.
 * @param plugin Instance of the IconFolderPlugin.
 * @param rule Custom rule where the nodes will be removed based on this rule.
 */
const removeFromAllFiles = async (plugin: IconFolderPlugin, rule: CustomRule): Promise<void> => {
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const files = Object.entries(fileExplorer.fileItems);
    for (const [path, fileItem] of files) {
      const fileType = (await plugin.app.vault.adapter.stat(path)).type;
      // Gets the icon name of the inheritance object or by the value directly.
      let iconName = plugin.getData()[path];
      if (typeof plugin.getData()[path] === 'object') {
        iconName = (plugin.getData()[path] as FolderIconObject).iconName;
      }

      if (!iconName && doesExistInPath(rule, path) && doesMatchFileType(rule, fileType)) {
        dom.removeIconInNode(fileItem.titleEl);
      }
    }
  }
};

/**
 * Tries to apply all custom rules to all files. This function iterates over all the saved
 * custom rules and calls {@link addToAllFiles}.
 * @param plugin Instance of the IconFolderPlugin.
 */
const addAll = async (plugin: IconFolderPlugin): Promise<void> => {
  for (const rule of plugin.getSettings().rules) {
    await addToAllFiles(plugin, rule);
  }
};

/**
 * Tries to add all specific custom rule icon to all registered files. It does that by
 * calling the {@link add} function.
 * @param plugin Instance of the IconFolderPlugin.
 * @param rule Custom rule that will be applied, if applicable, to all files.
 */
const addToAllFiles = async (plugin: IconFolderPlugin, rule: CustomRule): Promise<void> => {
  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    const files = Object.values(fileExplorer.fileItems);
    for (const fileItem of files) {
      await add(plugin, fileItem.titleEl, rule, fileItem.file);
    }
  }
};

/**
 * Tries to add the icon of the custom rule to a file or folder. This function also checks
 * if the file type matches the `for` property of the custom rule.
 * @param plugin Instance of the IconFolderPlugin.
 * @param container Element where the icon will be added if the custom rules matches.
 * @param rule Custom rule that will be used to check if the rule is applicable to the file.
 * @param file File or folder that will be used to possibly create the icon for.
 */
const add = async (
  plugin: IconFolderPlugin,
  container: HTMLElement,
  rule: CustomRule,
  file: TAbstractFile,
): Promise<void> => {
  // Gets the type of the file.
  const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;

  if (!doesMatchFileType(rule, fileType)) {
    return;
  }

  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (file.name.match(regex)) {
      dom.createIconNode(plugin, file.path, rule.icon, { color: rule.color, container });
    }
  } catch {
    // Rule is not applicable to a regex format.
    if (file.name.includes(rule.rule)) {
      dom.createIconNode(plugin, file.path, rule.icon, { color: rule.color, container });
    }
  }
};

/**
 * Determines whether a given rule exists in a given path.
 * @param rule Rule to check for.
 * @param path Path to check in.
 * @returns True if the rule exists in the path, false otherwise.
 */
const doesExistInPath = (rule: CustomRule, path: string): boolean => {
  const name = path.split('/').pop();
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (name.match(regex)) {
      return true;
    }
  } catch {
    // Rule is not in some sort of regex, check for basic string match.
    return name.includes(rule.rule);
  }

  return false;
};

/**
 * Gets a custom rule by its path.
 * @param plugin Instance of the plugin.
 * @param path Path to check for.
 * @returns The custom rule if it exists, undefined otherwise.
 */
const getByPath = (plugin: IconFolderPlugin, path: string): CustomRule | undefined => {
  if (path === 'settings' || path === 'migrated') {
    return undefined;
  }

  const rules = (plugin.getData()['settings'] as IconFolderSettings)?.rules;
  return rules.find((rule) => !emoji.isEmoji(rule.icon) && doesExistInPath(rule, path));
};

export default {
  doesExistInPath,
  getByPath,
  removeFromAllFiles,
  add,
  addAll,
  addToAllFiles,
  isApplicable,
};
