import { Notice, Plugin } from 'obsidian';
import MetaData from './MetaData';
import svg from './lib/util/svg';
import { getFileFromJSZipFile, readZipFile } from './zipUtil';
import JSZip from 'jszip';
import IconFolderPlugin from './main';

export interface Icon {
  name: string;
  prefix: string;
  iconPackName: string;
  filename: string;
  svgContent: string;
  svgViewbox: string;
  svgElement: string;
}

let path: string;

export const getPath = (): string => {
  return path;
};

export const setPath = (newPath: string): void => {
  if (newPath === 'plugins/obsidian-icon-folder/icons') {
    newPath = '.obsidian/plugins/obsidian-icon-folder/icons';
    new Notice(
      `[${MetaData.pluginName}] Due to a change in version v1.2.2, the icon pack folder changed. Please change it in the settings to not be directly in /plugins.`,
      8000,
    );
  }

  path = newPath;
};

const preloadedIcons: Icon[] = [];
let iconPacks: {
  name: string;
  prefix: string;
  custom: boolean;
  icons: Icon[];
}[] = [];

export const moveIconPackDirectories = async (plugin: Plugin, from: string, to: string): Promise<void> => {
  // Tries to move all icon packs to the new folder.
  for (let i = 0; i < iconPacks.length; i++) {
    const iconPack = iconPacks[i];
    // Tries to create a new directory in the new path.
    const doesDirExist = await createDirectory(plugin, iconPack.name);
    if (doesDirExist) {
      new Notice(`Directory with name ${iconPack.name} already exists.`);
      continue;
    }

    new Notice(`Moving ${iconPack.name}...`);

    // Move the zip file.
    if (await plugin.app.vault.adapter.exists(`${from}/${iconPack.name}.zip`)) {
      await plugin.app.vault.adapter.copy(`${from}/${iconPack.name}.zip`, `${to}/${iconPack.name}.zip`);
    }

    // Move all other files inside of the iconpack directory.
    const filesInDirectory = await getFilesInDirectory(plugin, `${from}/${iconPack.name}`);

    for (const file of filesInDirectory) {
      const fileName = file.split('/').pop();
      await plugin.app.vault.adapter.copy(`${from}/${iconPack.name}/${fileName}`, `${to}/${iconPack.name}/${fileName}`);
    }

    new Notice(`...moved ${iconPack.name}`);
  }

  // Removes all the existing icon packs in the `from` directory.
  for (let i = 0; i < iconPacks.length; i++) {
    const iconPack = iconPacks[i];
    if (await plugin.app.vault.adapter.exists(`${from}/${iconPack.name}`)) {
      await plugin.app.vault.adapter.rmdir(`${from}/${iconPack.name}`, true);
    }
  }

  // Remove root directory that contains all the icon packs.
  if (!to.startsWith(from)) {
    await plugin.app.vault.adapter.rmdir(`${from}`, true);
  }
};

export const createCustomIconPackDirectory = async (plugin: Plugin, dir: string): Promise<void> => {
  await createDirectory(plugin, dir);
  const prefix = createIconPackPrefix(dir);
  iconPacks.push({ name: dir, icons: [], prefix, custom: true });
};

export const deleteIconPack = async (plugin: Plugin, dir: string): Promise<void> => {
  iconPacks = iconPacks.filter((iconPack) => iconPack.name !== dir);
  // Check for the icon pack directory and delete it.
  if (await plugin.app.vault.adapter.exists(`${path}/${dir}`)) {
    await plugin.app.vault.adapter.rmdir(`${path}/${dir}`, true);
  }
  // Check for the icon pack zip file and delete it.
  if (await plugin.app.vault.adapter.exists(`${path}/${dir}.zip`)) {
    await plugin.app.vault.adapter.rmdir(`${path}/${dir}.zip`, true);
  }
};

export const doesIconPackExist = (plugin: Plugin, iconPackName: string): Promise<boolean> => {
  return plugin.app.vault.adapter.exists(`${path}/${iconPackName}`);
};

const createDirectory = async (plugin: Plugin, dir: string): Promise<boolean> => {
  const doesDirExist = await plugin.app.vault.adapter.exists(`${path}/${dir}`);
  if (!doesDirExist) {
    await plugin.app.vault.adapter.mkdir(`${path}/${dir}`);
  }

  return doesDirExist;
};

export const deleteFile = async (plugin: Plugin, filePath: string) => {
  await plugin.app.vault.adapter.remove(filePath);
};

export const getNormalizedName = (s: string) => {
  return s
    .split(/[ -]|[ _]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');
};

// export const normalizeFileName = async (plugin: Plugin, oldPath: string) => {
//   const fileName = oldPath.split('/').pop();
//   const newPath = oldPath.substring(0, oldPath.indexOf(fileName)) + getNormalizedName(fileName);
//   await plugin.app.vault.adapter.rename(oldPath, newPath);
// };

export const createZipFile = async (plugin: Plugin, filename: string, buffer: ArrayBuffer) => {
  await plugin.app.vault.adapter.writeBinary(`${path}/${filename}`, buffer);
};

export const createFile = async (
  plugin: Plugin,
  iconPackName: string,
  filename: string,
  content: string,
  absoluteFilename?: string,
): Promise<void> => {
  const normalizedFilename = getNormalizedName(filename);
  const exists = await plugin.app.vault.adapter.exists(`${path}/${iconPackName}/${normalizedFilename}`);
  if (exists) {
    const folderSplit = absoluteFilename.split('/');
    if (folderSplit.length >= 2) {
      const folderName = folderSplit[folderSplit.length - 2];
      const newFilename = folderName + normalizedFilename;
      await plugin.app.vault.adapter.write(`${path}/${iconPackName}/${newFilename}`, content);
      console.info(
        `[${MetaData.pluginName}] Renamed old file ${normalizedFilename} to ${newFilename} because of duplication.`,
      );
      new Notice(
        `[${MetaData.pluginName}] Renamed ${normalizedFilename} to ${newFilename} to avoid duplication.`,
        8000,
      );
    } else {
      console.warn(
        `[${MetaData.pluginName}] Could not create icons with duplicated file names (${normalizedFilename}).`,
      );
      new Notice(`[${MetaData.pluginName}] Could not create duplicated icon name (${normalizedFilename})`, 8000);
    }
  } else {
    await plugin.app.vault.adapter.write(`${path}/${iconPackName}/${normalizedFilename}`, content);
  }
};

export const createDefaultDirectory = async (plugin: Plugin): Promise<void> => {
  await createDirectory(plugin, '');
};

export const getAllIconPacks = () => {
  return iconPacks;
};

export const getIconPack = (name: string) => {
  return iconPacks.find((ip) => ip.name === name);
};

export const getFilesInDirectory = async (plugin: Plugin, dir: string): Promise<string[]> => {
  return (await plugin.app.vault.adapter.list(dir)).files;
};

const validIconName = /^[(A-Z)|(0-9)]/;
const svgViewboxRegex = /viewBox="([^"]*)"/g;
const svgContentRegex = /<svg.*>(.*?)<\/svg>/g;
const generateIcon = (iconPackName: string, iconName: string, content: string): Icon | null => {
  if (content.length === 0) {
    return;
  }

  content = content.replace(/(\r\n|\n|\r)/gm, '');
  content = content.replace(/>\s+</gm, '><');
  const normalizedName = iconName.charAt(0).toUpperCase() + iconName.substring(1);

  if (!validIconName.exec(normalizedName)) {
    console.log(`skipping icon with invalid name: ${iconName}`);
    return null;
  }

  const svgViewboxMatch = content.match(svgViewboxRegex);
  let svgViewbox: string = '';
  if (svgViewboxMatch && svgViewboxMatch.length !== 0) {
    svgViewbox = svgViewboxMatch[0];
  }

  const svgContentMatch = content.match(svgContentRegex);
  if (!svgContentMatch) {
    console.log(`skipping icon with invalid svg content: ${content}`);
    return null;
  }

  const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, '').replace(/<svg.+?>/g, ''))[0];

  const iconPackPrefix = createIconPackPrefix(iconPackName);

  const icon: Icon = {
    name: normalizedName.split('.svg')[0],
    prefix: iconPackPrefix,
    iconPackName,
    filename: iconName,
    svgContent,
    svgViewbox,
    svgElement: svg.extract(content),
  };

  return icon;
};

export const createIconPackPrefix = (iconPackName: string): string => {
  if (iconPackName.includes('-')) {
    const splitted = iconPackName.split('-');
    let result = splitted[0].charAt(0).toUpperCase();
    for (let i = 1; i < splitted.length; i++) {
      result += splitted[i].charAt(0).toLowerCase();
    }

    return result;
  }

  return iconPackName.charAt(0).toUpperCase() + iconPackName.charAt(1).toLowerCase();
};

export const loadUsedIcons = async (plugin: Plugin, icons: string[]) => {
  const iconPacks = (await listPath(plugin)).folders.map((iconPack) => iconPack.split('/').pop());

  for (let i = 0; i < icons.length; i++) {
    const entry = icons[i];
    if (!entry) {
      continue;
    }

    await loadIcon(plugin, iconPacks, entry);
  }
};

export const listPath = (plugin: Plugin, listPath?: string) => {
  return plugin.app.vault.adapter.list(listPath ?? path);
};

export const getIconPackNameByPrefix = (prefix: string): string => {
  return iconPacks.find((iconPack) => iconPack.prefix === prefix)?.name;
};

export const nextIdentifier = (iconName: string) => {
  return iconName.substring(1).search(/[(A-Z)|(0-9)]/) + 1;
};

export const loadIcon = async (plugin: Plugin, iconPacks: string[], iconName: string): Promise<void> => {
  const nextLetter = nextIdentifier(iconName);
  const prefix = iconName.substring(0, nextLetter);
  const name = iconName.substring(nextLetter);

  const iconPack = iconPacks.find((folder) => {
    const folderPrefix = createIconPackPrefix(folder);
    return prefix === folderPrefix;
  });

  if (!iconPack) {
    new Notice(`Seems like you do not have an icon pack installed. (${iconName})`, 5000);
    return;
  }

  const fullPath = path + '/' + iconPack + '/' + name + '.svg';
  if (!(await plugin.app.vault.adapter.exists(fullPath))) {
    console.warn(`[obsidian-icon-folder] icon with name "${name}" was not found (full path: ${fullPath}).`);
    return;
  }

  const content = await plugin.app.vault.adapter.read(fullPath);
  const icon = generateIcon(iconPack, name, content);
  preloadedIcons.push(icon);
};

export const initIconPacks = async (plugin: Plugin): Promise<void> => {
  // Remove the beginning slash because paths which start with `/` are the same as without
  // a slash.
  if (path.startsWith('/')) {
    path = path.slice(1);
  }

  const loadedIconPacks = await plugin.app.vault.adapter.list(path);
  // Extract all zip files which will be downloaded icon packs.
  const zipFiles: Record<string, JSZip.JSZipObject[]> = {};
  for (let i = 0; i < loadedIconPacks.files.length; i++) {
    const fileName = loadedIconPacks.files[i];
    if (fileName.endsWith('.zip')) {
      const arrayBuffer = await plugin.app.vault.adapter.readBinary(fileName);
      const files = await readZipFile(arrayBuffer);
      const iconPackName = fileName.split('/').pop().split('.zip')[0];
      zipFiles[iconPackName] = files;
    }
  }

  // Check for custom-made icon packs.
  for (let i = 0; i < loadedIconPacks.folders.length; i++) {
    const folderName = loadedIconPacks.folders[i].split('/').pop();
    // Continue if the icon pack does have a zip file.
    if (zipFiles[folderName]) {
      continue;
    }

    const files = await getFilesInDirectory(plugin, `${path}/${folderName}`);
    const loadedIcons: Icon[] = [];
    // Convert files into loaded svgs.
    for (let j = 0; j < files.length; j++) {
      const iconNameRegex = files[j].match(new RegExp(path + '/' + folderName + '/(.*)'));
      const iconName = iconNameRegex[1];
      const iconContent = await plugin.app.vault.adapter.read(files[j]);
      const icon = generateIcon(folderName, iconName, iconContent);
      if (icon) {
        loadedIcons.push(icon);
      }
    }

    const prefix = createIconPackPrefix(folderName);
    iconPacks.push({ name: folderName, icons: loadedIcons, prefix, custom: true });
    console.log(`loaded icon pack ${folderName} (${loadedIcons.length})`);
  }

  // Extract all files from the zip files.
  for (const zipFile in zipFiles) {
    const files = zipFiles[zipFile];
    const loadedIcons: Icon[] = await getLoadedIconsFromZipFile(zipFile, files);
    const prefix = createIconPackPrefix(zipFile);
    iconPacks.push({ name: zipFile, icons: loadedIcons, prefix, custom: false });
    console.log(`loaded icon pack ${zipFile} (${loadedIcons.length})`);
  }
};

const getLoadedIconsFromZipFile = async (iconPackName: string, files: JSZip.JSZipObject[]): Promise<Icon[]> => {
  const loadedIcons: Icon[] = [];
  for (let j = 0; j < files.length; j++) {
    const file = await getFileFromJSZipFile(files[j]);
    const iconContent = await file.text();
    const iconName = file.name;
    const icon = generateIcon(iconPackName, iconName, iconContent);
    if (icon) {
      loadedIcons.push(icon);
    }
  }
  return loadedIcons;
};

export const addIconToIconPack = (iconPackName: string, iconName: string, iconContent: string): Icon | undefined => {
  // Normalize the icon name to remove `-` or `_` in the name.
  iconName = getNormalizedName(iconName);
  const icon = generateIcon(iconPackName, iconName, iconContent);
  if (!icon) {
    console.warn(`[obsidian-icon-folder] icon could not be generated (icon: ${iconName}, content: ${iconContent}).`);
    return undefined;
  }

  const iconPack = iconPacks.find((iconPack) => iconPack.name === iconPackName);
  if (!iconPack) {
    console.warn(`[obsidian-icon-folder] iconpack with name "${iconPackName}" was not found.`);
    return undefined;
  }

  iconPack.icons.push(icon);

  return icon;
};

export const removeIconFromIconPackDirectory = (
  plugin: IconFolderPlugin,
  iconPackName: string,
  iconName: string,
): Promise<void> => {
  const iconPack = iconPacks.find((iconPack) => iconPack.name === iconPackName);
  // Checks if icon pack is custom-made.
  if (!iconPack.custom) {
    return plugin.app.vault.adapter.rmdir(`${path}/${iconPackName}/${iconName}.svg`, true);
  }
};

export const extractIconToIconPack = async (plugin: Plugin, icon: Icon, iconContent: string) => {
  const doesIconPackDirExist = await plugin.app.vault.adapter.exists(`${path}/${icon.iconPackName}`);
  if (!doesIconPackDirExist) {
    await plugin.app.vault.adapter.mkdir(`${path}/${icon.iconPackName}`);
  }

  const doesIconFileExists = await plugin.app.vault.adapter.exists(`${path}/${icon.iconPackName}/${icon.name}.svg`);
  if (!doesIconFileExists) {
    await createFile(plugin, icon.iconPackName, `${icon.name}.svg`, iconContent);
  }
};

export const getAllLoadedIconNames = (): Icon[] => {
  return iconPacks.reduce((total: Icon[], iconPack) => {
    total.push(...iconPack.icons);
    return total;
  }, []);
};

export const registerIconPack = async (name: string, arrayBuffer: ArrayBuffer) => {
  const files = await readZipFile(arrayBuffer);
  const loadedIcons: Icon[] = await getLoadedIconsFromZipFile(name, files);
  const prefix = createIconPackPrefix(name);
  iconPacks.push({ name, icons: loadedIcons, prefix, custom: false });
  console.log(`loaded icon pack ${name} (${loadedIcons.length})`);
};

export const doesIconExists = (iconName: string): boolean => {
  const icons = getAllLoadedIconNames();
  return icons.find((icon) => icon.name === iconName || icon.prefix + icon.name === iconName) !== undefined;
};

export const getSvgFromLoadedIcon = (iconPrefix: string, iconName: string): string => {
  let icon = '';
  let foundIcon = preloadedIcons.find(
    (icon) =>
      icon.prefix.toLowerCase() === iconPrefix.toLowerCase() && icon.name.toLowerCase() === iconName.toLowerCase(),
  );
  if (!foundIcon) {
    iconPacks.forEach((iconPack) => {
      const icon = iconPack.icons.find(
        (icon) =>
          icon.prefix.toLowerCase() === iconPrefix.toLowerCase() && icon.name.toLowerCase() === iconName.toLowerCase(),
      );
      if (icon) {
        foundIcon = icon;
      }
    });
  }

  if (foundIcon) {
    icon = foundIcon.svgElement;
  }

  return icon;
};
