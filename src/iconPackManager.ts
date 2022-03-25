import { Notice, Plugin } from 'obsidian';

export interface Icon {
  name: string;
  prefix: string;
  filename: string;
  svgPath: string | { fill: string; d: string }[];
  svgContent: string;
  svgViewbox: string;
}

let path: string;

export const getPath = (): string => {
  return path;
};

export const setPath = (newPath: string): void => {
  path = `.obsidian/${newPath}`;
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
      await plugin.app.vault.adapter.copy(
        `${from}/${iconPack.name}/${icon.filename}`,
        `${to}/${iconPack.name}/${icon.filename}`,
      );
    }

    new Notice(`...moved ${iconPack.name}`);
  }

  await plugin.app.vault.adapter.rmdir(from, true);
};

export const createIconPackDirectory = async (plugin: Plugin, dir: string): Promise<void> => {
  await createDirectory(plugin, dir);
  iconPacks.push({ name: dir, icons: [] });
};

export const deleteIconPack = async (plugin: Plugin, dir: string): Promise<void> => {
  const newIconPacks = iconPacks.filter((iconPack) => iconPack.name !== dir);
  iconPacks = newIconPacks;
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

export const createFile = async (
  plugin: Plugin,
  iconPackName: string,
  filename: string,
  content: string,
): Promise<void> => {
  const normalizedName = filename
    .split(/[ -]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  await plugin.app.vault.adapter.write(`${path}/${iconPackName}/${normalizedName}`, content);
};

export const createDefaultDirectory = async (plugin: Plugin): Promise<void> => {
  await createDirectory(plugin, '');
};

export const getAllIconPacks = () => {
  return iconPacks;
};

const getFilesInDirectory = async (plugin: Plugin, dir: string): Promise<string[]> => {
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
  const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, ''))[0];

  const iconPackPrefix = createIconPackPrefix(iconPackName);

  const icon: Icon = {
    name: normalizedName.split('.svg')[0],
    prefix: iconPackPrefix,
    filename: iconName,
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

export const nextUpperCaseLetter = (iconName: string) => {
  return iconName.substring(1).search(/[A-Z]/) + 1;
};

export const loadIcon = async (plugin: Plugin, iconPacks: string[], iconName: string): Promise<void> => {
  const nextLetter = nextUpperCaseLetter(iconName);
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

  if (!(await plugin.app.vault.adapter.exists(path + '/' + iconPack + '/' + name + '.svg'))) {
    return;
  }

  const content = await plugin.app.vault.adapter.read(path + '/' + iconPack + '/' + name + '.svg');
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
      console.log(`loaded icon pack ${iconPackName}`);
    }
  }
};

export const addIconToIconPack = (
  iconPackName: string,
  iconName: string,
  iconContent: string,
  callback?: (icon: Icon) => void,
): void => {
  const icon = generateIcon(iconPackName, iconName, iconContent);
  if (!icon) {
    return;
  }

  const iconPack = iconPacks.find((iconPack) => iconPack.name === iconPackName);
  if (!iconPack) {
    return;
  }

  iconPack.icons.push(icon);

  if (callback) {
    callback(icon);
  }
};

export const getAllLoadedIconNames = (): Icon[] => {
  return iconPacks.reduce((total: Icon[], iconPack) => {
    total.push(...iconPack.icons);
    return total;
  }, []);
};

export const getSvgFromLoadedIcon = (iconName: string): string => {
  let icon = '';
  let foundIcon = preloadedIcons.find((icon) => icon.name.toLowerCase() === iconName.toLowerCase());
  if (!foundIcon) {
    iconPacks.forEach((iconPack) => {
      const icon = iconPack.icons.find((icon) => icon.name.toLowerCase() === iconName.toLowerCase());
      if (icon) {
        foundIcon = icon;
      }
    });
  }

  if (foundIcon) {
    let fileContent = '';
    if (typeof foundIcon.svgPath === 'object') {
      const svgContent = foundIcon.svgPath.reduce((total, current) => {
        total += `<path fill="${current.fill ?? 'currentColor'}" d="${current}" />`;
        return total;
      }, '');

      fileContent = `<svg width="16" fill="currentColor" height="16" ${
        foundIcon.svgViewbox.length !== 0 ? foundIcon.svgViewbox : 'viewbox="0 0 24 24"'
      }>${svgContent}</svg>`;
    } else {
      fileContent = `<svg width="16" height="16" ${foundIcon.svgPath.includes('fill=') ? '' : 'fill="currentColor"'} ${
        foundIcon.svgViewbox.length !== 0 ? foundIcon.svgViewbox : 'viewbox="0 0 24 24"'
      }><path d="${foundIcon.svgPath}" /></svg>`;
    }
    icon = fileContent;
  }

  return icon;
};
