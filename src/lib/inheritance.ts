import { TAbstractFile, TFile } from 'obsidian';
import { FileItem } from '../@types/obsidian';
import IconFolderPlugin, { FolderIconObject } from '../main';
import dom from './dom';
import iconTabs from './iconTabs';

interface AddOptions {
  file?: TAbstractFile;
}

/**
 * Gets all the inheritance folder from the data as an object which consists of the path
 * as a key and the value as the object. It does that by including all objects (except
 * the settings).
 * @param plugin IconFolderPlugin that will be used to get the data from.
 * @returns An object where the keys are the paths and the values are the objects.
 */
const getFolders = (plugin: IconFolderPlugin): Record<string, FolderIconObject> => {
  return Object.entries(plugin.getData())
    .filter(([k, v]) => k !== 'settings' && typeof v === 'object')
    .reduce<Record<string, FolderIconObject>>((prev, [path, value]) => {
      prev[path] = value as FolderIconObject;
      return prev;
    }, {});
};

const add = (plugin: IconFolderPlugin, folderPath: string, iconName: string, options?: AddOptions): void => {
  const folder = plugin.getData()[folderPath];
  // Checks if data exists and if the data is some kind of object type.
  if (!folder || typeof folder !== 'object') {
    return;
  }

  // A inner function that helps to add the inheritance icon to the DOM.
  const addIcon = (fileItem: FileItem): void => {
    const iconNode = fileItem.titleEl.createDiv();
    iconNode.classList.add('obsidian-icon-folder-icon');
    dom.setIconForNode(plugin, iconName, iconNode);
    fileItem.titleEl.insertBefore(iconNode, fileItem.titleInnerEl);

    // Adds icon to tabs for inherited files.
    if (plugin.getSettings().iconInTabsEnabled) {
      iconTabs.add(plugin, fileItem.file as TFile, { iconName: (folder as FolderIconObject).inheritanceIcon });
    }
  };

  const inheritanceFolders = getFolders(plugin);

  for (const fileExplorer of plugin.getRegisteredFileExplorers()) {
    if (options?.file) {
      // Handles the addition of the inheritance icon for only one file.
      const fileItem = fileExplorer.fileItems[options.file.path];
      const inFolder = options.file.path.includes(folderPath);
      const hasIcon = plugin.getData()[fileItem.file.path];
      if (!fileItem || !inFolder || hasIcon) {
        continue;
      }

      addIcon(fileItem);
    } else {
      // Handles the addition of a completely new inheritance for a folder.
      for (const [path, fileItem] of Object.entries(fileExplorer.fileItems)) {
        const inFolder = path.includes(folderPath);
        const isInheritanceDirectory = inheritanceFolders[path];
        const hasIcon = plugin.getData()[fileItem.file.path];
        if (!inFolder || isInheritanceDirectory || hasIcon) {
          continue;
        }

        addIcon(fileItem);
      }
    }
  }
};

const remove = (plugin: IconFolderPlugin, folderPath: string): void => {
  const folder = plugin.getData()[folderPath];
  // Checks if data exists and if the data is some kind of object type.
  if (!folder || typeof folder !== 'object') {
    return;
  }

  // Gets all files that include the folder path of the currently opened vault.
  const files = plugin.app.vault.getFiles().filter((file) => file.path.includes(folderPath));

  for (const file of files) {
    // When the file path is not registered in the data it should remove the icon.
    if (!plugin.getData()[file.path]) {
      // Removes the icon from the tabs for inherited files.
      if (plugin.getSettings().iconInTabsEnabled) {
        iconTabs.remove(file, { replaceWithDefaultIcon: true });
      }

      dom.removeIconInPath(file.path);
    }
  }
};

const getByPath = (plugin: IconFolderPlugin, path: string): FolderIconObject | undefined => {
  const folders = getFolders(plugin);
  const [_, folderIcon] = Object.entries(folders).find(([folderPath]) => path.includes(folderPath));
  return folderIcon;
};

const doesExistInPath = (plugin: IconFolderPlugin, path: string): boolean => {
  const folders = getFolders(plugin);
  return Object.keys(folders).some((folderPath) => path.includes(folderPath));
};

export default {
  add,
  remove,
  getByPath,
  doesExistInPath,
};
