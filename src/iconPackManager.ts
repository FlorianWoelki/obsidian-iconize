import { Notice, Plugin } from 'obsidian';
import MetaData from './MetaData';

export interface Icon {
  name: string;
  prefix: string;
  filename: string;
  svgElement: string;
  svgPath: string | { fill: string; d: string }[];
  svgContent: string;
  svgViewbox: string;
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
  icons: Icon[];
}[] = [];

export const moveIconPackDirectories = async (plugin: Plugin, from: string, to: string): Promise<void> => {
  for (let i = 0; i < iconPacks.length; i++) {
    const iconPack = iconPacks[i];
    const doesDirExist = await createDirectory(plugin, iconPack.name);
    if (doesDirExist) {
      new Notice(`Directory with name ${iconPack.name} already exists.`);
      continue;
    }

    new Notice(`Moving ${iconPack.name}...`);

    for (let j = 0; j < iconPack.icons.length; j++) {
      const icon = iconPack.icons[j];
      if (await plugin.app.vault.adapter.exists(`${from}/${iconPack.name}`)) {
        await plugin.app.vault.adapter.copy(
          `${from}/${iconPack.name}/${icon.filename}`,
          `${to}/${iconPack.name}/${icon.filename}`,
        );
      }
    }

    new Notice(`...moved ${iconPack.name}`);
  }

  for (let i = 0; i < iconPacks.length; i++) {
    const iconPack = iconPacks[i];
    if (await plugin.app.vault.adapter.exists(`${from}/${iconPack.name}`)) {
      await plugin.app.vault.adapter.rmdir(`${from}/${iconPack.name}`, true);
    }
  }
};

export const createIconPackDirectory = async (plugin: Plugin, dir: string): Promise<void> => {
  await createDirectory(plugin, dir);
  iconPacks.push({ name: dir, icons: [] });
};

export const deleteIconPack = async (plugin: Plugin, dir: string): Promise<void> => {
  iconPacks = iconPacks.filter((iconPack) => iconPack.name !== dir);
  await plugin.app.vault.adapter.rmdir(`${path}/${dir}`, true);
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

export const normalizeFileName = async (plugin: Plugin, oldPath: string) => {
  const fileName = oldPath.split('/').pop();
  const newPath = oldPath.substring(0, oldPath.indexOf(fileName)) + getNormalizedName(fileName);
  await plugin.app.vault.adapter.rename(oldPath, newPath);
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

const svgPathRegex = /<path\s([^>]*)>/g;
const svgAttrRegex = /(?:\s*|^)([^= ]*)="([^"]*)"/g;
const extractPaths = (content: string) => {
  const allPaths = [];
  while (true) {
    const svgPathMatches = svgPathRegex.exec(content);
    const svgPath = svgPathMatches && svgPathMatches[1];
    if (!svgPath) {
      const svgContentMatch = content.match(svgContentRegex);
      const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, '').replace(/<svg.+?>/g, ''))[0];
      allPaths.push(svgContent);
      break;
    }

    const attrs: any = {};
    while (true) {
      const svgAttrMatches = svgAttrRegex.exec(svgPath);
      if (!svgAttrMatches) {
        break;
      }
      attrs[svgAttrMatches[1]] = svgAttrMatches[2];
    }
    if (attrs.fill === 'none') {
      continue;
    }
    allPaths.push(attrs.d ?? attrs);
  }

  return allPaths;
};

const validIconName = /^[(A-Z)|(0-9)]/;
const svgViewboxRegex = /viewBox="([^"]*)"/g;
const svgContentRegex = /<svg.*>(.*?)<\/svg>/g;
const svgElementRegex = /<svg [^>]+[\w]="(.*?)"+>/g;
const strokeWidthRegex = /stroke-width="\d+"/g;
const generateIcon = (iconPackName: string, iconName: string, content: string): Icon | null => {
  if (content.length === 0) {
    return;
  }

  content = content.replace(/(\r\n|\n|\r)/gm, '');
  content = content.replace(/>\s+</gm, '><');
  const normalizedName = iconName
    .split(/[ -]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  if (!validIconName.exec(normalizedName)) {
    console.log(`skipping icon with invalid name: ${iconName}`);
    return null;
  }

  let svgPaths;
  try {
    svgPaths = extractPaths(content);
  } catch (err) {
    console.log(err);
    return null;
  }

  const svgViewboxMatch = content.match(svgViewboxRegex);
  let svgViewbox: string = '';
  if (svgViewboxMatch && svgViewboxMatch.length !== 0) {
    svgViewbox = svgViewboxMatch[0];
  }

  const svgContentMatch = content.match(svgContentRegex);
  const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, '').replace(/<svg.+?>/g, ''))[0];
  const svgElement = content.match(svgElementRegex);

  const iconPackPrefix = createIconPackPrefix(iconPackName);

  const icon: Icon = {
    name: normalizedName.split('.svg')[0],
    prefix: iconPackPrefix,
    filename: iconName,
    svgElement: svgElement.length === 1 ? svgElement[0] : '',
    svgPath: svgPaths.length === 1 ? svgPaths[0] : svgPaths,
    svgContent,
    svgViewbox,
  };

  return icon;
};

export const createIconPackPrefix = (iconPackName: string): string => {
  if (iconPackName.includes('-')) {
    const splitted = iconPackName.split('-');
    let result = splitted[0].charAt(0).toUpperCase();
    for (let i = 1; i < splitted.length; i++) {
      result += splitted[i].charAt(0);
    }

    return result;
  }

  return iconPackName.charAt(0).toUpperCase() + iconPackName.charAt(1);
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
  // Load all the custom generated icon packs.
  const loadedIconPacks = await plugin.app.vault.adapter.list(path);
  for (let i = 0; i < loadedIconPacks.folders.length; i++) {
    const folder = loadedIconPacks.folders[i];
    const iconPackRegex = folder.match(new RegExp(path + '/(.*)'));
    if (iconPackRegex.length > 1) {
      const iconPackName = iconPackRegex[1];
      const icons = await getFilesInDirectory(plugin, folder);

      const loadedIcons: Icon[] = [];
      // Convert files into loaded svgs.
      for (let j = 0; j < icons.length; j++) {
        const iconNameRegex = icons[j].match(new RegExp(path + '/' + iconPackName + '/(.*)'));
        const iconName = iconNameRegex[1];
        const iconContent = await plugin.app.vault.adapter.read(icons[j]);
        const icon = generateIcon(iconPackName, iconName, iconContent);
        if (icon) {
          loadedIcons.push(icon);
        }
      }

      iconPacks.push({ name: iconPackName, icons: loadedIcons });
      console.log(`loaded icon pack ${iconPackName} (${loadedIcons.length})`);
    }
  }
};

export const addIconToIconPack = (iconPackName: string, iconName: string, iconContent: string): Icon | undefined => {
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

export const getAllLoadedIconNames = (): Icon[] => {
  return iconPacks.reduce((total: Icon[], iconPack) => {
    total.push(...iconPack.icons);
    return total;
  }, []);
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
    let fileContent: string;
    const strokeWidthMatch = foundIcon.svgElement.match(strokeWidthRegex);
    const strokeWidth = strokeWidthMatch?.length > 0 ? strokeWidthMatch[0] : '';

    if (typeof foundIcon.svgPath === 'object') {
      const doesStrokeExists =
        foundIcon.svgPath.filter((path: any) => path.match(/stroke=".*"/g)).length !== 0 ||
        foundIcon.svgElement.includes('stroke="currentColor"');

      fileContent = `<svg width="16" ${
        doesStrokeExists ? `fill="none" stroke="currentColor" ${strokeWidth}` : 'fill="currentColor"'
      } height="16" ${foundIcon.svgViewbox.length !== 0 ? foundIcon.svgViewbox : 'viewbox="0 0 24 24"'}>${
        foundIcon.svgContent
      }</svg>`;
    } else {
      const doesStrokeExists =
        foundIcon.svgPath.includes('stroke="currentColor"') || foundIcon.svgElement.includes('stroke="currentColor"');
      fileContent = `<svg width="16" height="16" ${
        doesStrokeExists ? `fill="none" stroke="currentColor" ${strokeWidth}` : 'fill="currentColor"'
      } ${foundIcon.svgViewbox.length !== 0 ? foundIcon.svgViewbox : 'viewbox="0 0 24 24"'}>${
        foundIcon.svgContent
      }</svg>`;
    }
    icon = fileContent;
  }

  return icon;
};
