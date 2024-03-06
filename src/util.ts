import {
  extractIconToIconPack,
  getIconFromIconPack,
  getIconPackNameByPrefix,
  getSvgFromLoadedIcon,
  nextIdentifier,
  removeIconFromIconPackDirectory,
} from '@app/icon-pack-manager';
import { FileItem, FileWithLeaf } from './@types/obsidian';
import IconFolderPlugin from './main';

// Default obsidian file icon.
export const DEFAULT_FILE_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-file"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';

// Default obsidian folder icon.
export const DEFAULT_FOLDER_ICON =
  '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon lucide-folder"><path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"></path></svg>';

/**
 * Tries to read the file synchronously.
 * @param file File that will be read.
 * @returns A promise that will resolve to a string which is the content of the file.
 */
export const readFileSync = async (file: File): Promise<string> => {
  const content = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8');
    reader.onload = (readerEvent) =>
      resolve(readerEvent.target.result as string);
  });

  return content;
};

/**
 * Gets all the currently opened files by getting the markdown leaves and then checking
 * for the `file` property in the view. This also returns the leaf of the file.
 * @param plugin Instance of the IconFolderPlugin.
 * @returns An array of {@link FileWithLeaf} objects.
 */
export const getAllOpenedFiles = (plugin: IconFolderPlugin): FileWithLeaf[] => {
  return plugin.app.workspace
    .getLeavesOfType('markdown')
    .reduce<FileWithLeaf[]>((prev, curr) => {
      const file = curr.view.file;
      if (file) {
        prev.push({ ...file, leaf: curr });
      }
      return prev;
    }, []);
};

/**
 * Gets the file item title element by either accessing `titleEl` or `selfEl`.
 * @param fileItem FileItem which will be used to retrieve the title element from.
 * @returns HTMLElement which is the title element.
 */
export const getFileItemTitleEl = (fileItem: FileItem): HTMLElement => {
  return fileItem.titleEl ?? fileItem.selfEl;
};

/**
 * Gets the file item inner title element by either accessing `titleInnerEl` or `innerEl`.
 * @param fileItem FileItem which will be used to retrieve the inner title element from.
 * @returns HTMLElement which is the inner title element.
 */
export const getFileItemInnerTitleEl = (fileItem: FileItem): HTMLElement => {
  return fileItem.titleInnerEl ?? fileItem.innerEl;
};

/**
 * A utility function which will add the icon to the icon pack and then extract the icon
 * to the icon pack.
 * @param plugin IconFolderPlugin that will be used for extracting the icon.
 * @param iconNameWithPrefix String that will be used to add the icon to the icon pack.
 */
export const saveIconToIconPack = (
  plugin: IconFolderPlugin,
  iconNameWithPrefix: string,
): void => {
  const iconNextIdentifier = nextIdentifier(iconNameWithPrefix);
  const iconName = iconNameWithPrefix.substring(iconNextIdentifier);
  const iconPrefix = iconNameWithPrefix.substring(0, iconNextIdentifier);
  const possibleIcon = getSvgFromLoadedIcon(iconPrefix, iconName);
  if (!possibleIcon) {
    throw new Error(`Icon ${iconNameWithPrefix} could not be found.`);
  }

  const iconPackName = getIconPackNameByPrefix(iconPrefix);
  const icon = getIconFromIconPack(iconPackName, iconPrefix, iconName);
  extractIconToIconPack(plugin, icon, possibleIcon);
};

/**
 * A utility function which will remove the icon from the icon pack by removing the icon
 * file from the icon pack directory.
 * @param plugin IconFolderPlugin that will be used for removing the icon.
 * @param iconNameWithPrefix String that will be used to remove the icon from the icon pack.
 */
export const removeIconFromIconPack = (
  plugin: IconFolderPlugin,
  iconNameWithPrefix: string,
): void => {
  const identifier = nextIdentifier(iconNameWithPrefix);
  const prefix = iconNameWithPrefix.substring(0, identifier);
  const iconName = iconNameWithPrefix.substring(identifier);
  const iconPackName = getIconPackNameByPrefix(prefix);
  const duplicatedIcon = plugin.getDataPathByValue(iconNameWithPrefix);
  if (!duplicatedIcon) {
    removeIconFromIconPackDirectory(plugin, iconPackName, iconName);
  }
};

/**
 * A utility function which will convert a string to a hexadecimal color.
 * @param str String that will be converted to a hexadecimal color.
 * @returns A string which is the hexadecimal color.
 */
export const stringToHex = (str: string): string => {
  const validHex = str.replace(/[^0-9a-fA-F]/g, '');
  const hex = validHex.padStart(6, '0').substring(0, 6);
  return `#${hex}`;
};

/**
 * A utility function which will check if a string is a hexadecimal color.
 * @param str String that will be checked if it is a hexadecimal color.
 * @param includeHash Boolean which will include the hash in the check.
 * @returns A boolean which is true if the string is a hexadecimal color.
 */
export const isHexadecimal = (str: string, includeHash = false): boolean => {
  const regex = new RegExp(`^${includeHash ? '#' : ''}[0-9A-Fa-f]{1,6}$`);
  return regex.test(str);
};
