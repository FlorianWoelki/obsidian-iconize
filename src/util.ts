import IconFolderPlugin from './main';
import { TFile } from 'obsidian';

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
