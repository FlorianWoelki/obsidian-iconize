import { TAbstractFile } from 'obsidian';
import IconFolderPlugin from '../main';
import { CustomRule } from '../settings';
import { addToDOM, insertIconToNode } from '../util';

export type CustomRuleFileType = 'file' | 'folder';

const doesMatchFileType = (rule: CustomRule, fileType: CustomRuleFileType): boolean => {
  return (
    rule.for === 'everything' ||
    (rule.for === 'files' && fileType === 'file') ||
    (rule.for === 'folders' && fileType === 'folder')
  );
};

/**
 * Determines whether a given file matches a specified custom rule.
 * @param plugin The plugin object containing the app and other plugin data.
 * @param rule The custom rule to check against the file.
 * @param file The file to check against the custom rule.
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

const addAll = async (plugin: IconFolderPlugin, rule: CustomRule) => {};

// TODO: Refactor.
const add = async (plugin: IconFolderPlugin, rule: CustomRule, file?: TAbstractFile) => {
  try {
    // Rule is in some sort of regex.
    const regex = new RegExp(rule.rule);
    if (file) {
      const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
      if (file.name.match(regex) && doesMatchFileType(rule, fileType)) {
        addToDOM(plugin, file.path, rule.icon, rule.color);
      }
    } else {
      plugin.getRegisteredFileExplorers().forEach(async (explorerView) => {
        const files = Object.entries(explorerView.fileItems);
        files.forEach(async ([path, fileItem]) => {
          const fileType = (await plugin.app.vault.adapter.stat(path)).type;
          if (fileItem) {
            const fileName = path.split('/').pop();
            if (fileName.match(regex) && doesMatchFileType(rule, fileType)) {
              const titleEl = fileItem.titleEl;
              const titleInnerEl = fileItem.titleInnerEl;
              const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
              if (!existingIcon) {
                const iconNode = titleEl.createDiv();
                iconNode.classList.add('obsidian-icon-folder-icon');

                insertIconToNode(plugin, rule.icon, iconNode);

                titleEl.insertBefore(iconNode, titleInnerEl);
              }
            }
          }
        });
      });
    }
  } catch {
    // Rule is not applicable to a regex format.
    if (file) {
      const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
      if (file.name.includes(rule.rule) && doesMatchFileType(rule, fileType)) {
        addToDOM(plugin, file.path, rule.icon, rule.color);
      }
    } else {
      plugin.app.vault.getAllLoadedFiles().forEach(async (file) => {
        const fileType = (await plugin.app.vault.adapter.stat(file.path)).type;
        if (file.name.includes(rule.rule) && doesMatchFileType(rule, fileType)) {
          addToDOM(plugin, file.path, rule.icon, rule.color);
        }
      });
    }
  }
};

export default {
  add,
  isApplicable,
};
