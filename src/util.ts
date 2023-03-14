import emoji from './emoji';
import IconFolderPlugin, { FolderIconObject } from './main';
import type { ExplorerView } from './@types/obsidian';
import { CustomRule, IconFolderSettings } from './settings';
import { TFile } from 'obsidian';
import dom from './lib/dom';
import customRule from './lib/customRule';
// import iconTabs from './lib/iconTabs';

/**
 * This function adds the icons to the DOM.
 * For that, it will create a `div` element with the class `obsidian-icon-folder-icon` that will be customized based on the user settings.
 *
 * @public
 * @param {IconFolderPlugin} plugin - The main plugin.
 * @param {[string, string | FolderIconObject][]} data - The data that includes the icons.
 * @param {WeakMap<ExplorerLeaf, boolean>} registeredFileExplorers - The already registered file explorers.
 */
export const addIconsToDOM = (
  plugin: IconFolderPlugin,
  data: [string, string | FolderIconObject][],
  registeredFileExplorers: WeakSet<ExplorerView>,
  callback?: () => void,
): void => {
  const fileExplorers = plugin.app.workspace.getLeavesOfType('file-explorer');
  fileExplorers.forEach((fileExplorer) => {
    if (registeredFileExplorers.has(fileExplorer.view)) {
      return;
    }

    registeredFileExplorers.add(fileExplorer.view);

    // create a map with registered file paths to have constant look up time
    const registeredFilePaths: Record<string, boolean> = {};
    data.forEach(([path]) => {
      registeredFilePaths[path] = true;
    });

    data.forEach(([dataPath, value]) => {
      const fileItem = fileExplorer.view.fileItems[dataPath];
      if (fileItem) {
        const titleEl = fileItem.titleEl;
        const titleInnerEl = fileItem.titleInnerEl;

        // needs to check because of the refreshing the plugin will duplicate all the icons
        if (titleEl.children.length === 2 || titleEl.children.length === 1) {
          const iconName = typeof value === 'string' ? value : value.iconName;
          if (iconName) {
            const existingIcon = titleEl.querySelector('.obsidian-icon-folder-icon');
            if (existingIcon) {
              existingIcon.remove();
            }

            const iconNode = titleEl.createDiv();
            iconNode.classList.add('obsidian-icon-folder-icon');

            dom.setIconForNode(plugin, iconName, iconNode);

            titleEl.insertBefore(iconNode, titleInnerEl);
          }

          if (typeof value === 'object' && value.inheritanceIcon) {
            const files = plugin.app.vault.getFiles().filter((f) => f.path.includes(dataPath));
            const inheritanceIconName = value.inheritanceIcon;
            files.forEach((f) => {
              if (!registeredFilePaths[f.path]) {
                const inheritanceFileItem = fileExplorer.view.fileItems[f.path];
                const existingIcon = inheritanceFileItem.titleEl.querySelector('.obsidian-icon-folder-icon');
                if (existingIcon) {
                  existingIcon.remove();
                }

                const iconNode = inheritanceFileItem.titleEl.createDiv();
                iconNode.classList.add('obsidian-icon-folder-icon');

                dom.setIconForNode(plugin, inheritanceIconName, iconNode);

                inheritanceFileItem.titleEl.insertBefore(iconNode, inheritanceFileItem.titleInnerEl);
              }
            });
          }
        }
      }
    });

    if (callback) {
      callback();
    }
  });

  customRule.addAll(plugin);
};

export const updateEmojiIconsInDOM = (plugin: IconFolderPlugin): void => {
  plugin.getRegisteredFileExplorers().forEach(async (explorerView) => {
    const files = Object.entries(explorerView.fileItems);
    files.forEach(async ([path]) => {
      const iconName =
        typeof plugin.getData()[path] === 'object'
          ? (plugin.getData()[path] as FolderIconObject).iconName
          : (plugin.getData()[path] as string);

      if (emoji.isEmoji(iconName)) {
        dom.createIconNode(plugin, path, iconName);
      }
    });
  });

  customRule.addAll(plugin);
};

/**
 * Tries to read the file synchronously.
 * @param file File that will be read.
 * @returns A promise that will resolve to a string which is the content of the file.
 */
export const readFileSync = async (file: File): Promise<string> => {
  const content = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (readerEvent) => resolve(readerEvent.target.result as string);
  });

  return content;
};

/**
 * Gets all the currently opened files by getting the markdown leaves and then checking
 * for the `file` property in the view.
 * @param plugin Instance of the IconFolderPlugin.
 * @returns An array of {@link TFile} objects.
 */
export const getAllOpenedFiles = (plugin: IconFolderPlugin): TFile[] => {
  return plugin.app.workspace.getLeavesOfType('markdown').reduce<TFile[]>((prev, curr) => {
    const file = curr.view.file;
    if (file) {
      prev.push(file);
    }
    return prev;
  }, []);
};
