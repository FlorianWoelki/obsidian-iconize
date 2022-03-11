import { Plugin } from 'obsidian';

export interface Icon {
  name: string;
  prefix: string;
  filename: string;
  svgPath: string | { fill: string; d: string }[];
  svgContent: string;
  svgViewbox: string;
}

const path = '.obsidian/plugins/obsidian-icon-folder/icons';
let iconPacks: {
  name: string;
  icons: Icon[];
}[] = [];

export const createIconPackDirectory = async (plugin: Plugin, dir: string): Promise<void> => {
  await createDirectory(plugin, dir);
  iconPacks.push({ name: dir, icons: [] });
};

export const deleteIconPack = async (plugin: Plugin, dir: string): Promise<void> => {
  const newIconPacks = iconPacks.filter((iconPack) => iconPack.name !== dir);
  iconPacks = newIconPacks;
  await plugin.app.vault.adapter.rmdir(`${path}/${dir}`, true);
};

const createDirectory = async (plugin: Plugin, dir: string): Promise<void> => {
  const doesDirExist = await plugin.app.vault.adapter.exists(`${path}/${dir}`);
  if (!doesDirExist) {
    await plugin.app.vault.adapter.mkdir(`${path}/${dir}`);
  }
};

export const createFile = async (
  plugin: Plugin,
  iconPackName: string,
  filename: string,
  content: string,
): Promise<void> => {
  await plugin.app.vault.adapter.write(`${path}/${iconPackName}/${filename}`, content);
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
    allPaths.push(attrs);
  }

  return allPaths;
};

const validIconName = /^[A-Z]/;
const svgViewboxRegex = /viewBox="([^"]*)"/g;
const svgContentRegex = /<svg.*>(.*?)<\/svg>/g;
const generateIcon = (iconPackName: string, iconName: string, content: string): Icon => {
  const normalizedName = iconName
    .split(/[ -]/g)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  if (!validIconName.exec(normalizedName)) {
    console.log(`skipping icon with invalid name: ${iconName}`);
    return;
  }

  let svgPaths;
  try {
    svgPaths = extractPaths(content);
  } catch (err) {
    console.log(err);
    return;
  }

  const svgViewbox = content.match(svgViewboxRegex)[0];
  const svgContentMatch = content.match(svgContentRegex);
  const svgContent = svgContentMatch.map((val) => val.replace(/<\/?svg>/g, ''))[0];

  const iconPackPrefix = iconPackName.substring(0, 2);

  const icon: Icon = {
    name: normalizedName.split('.svg')[0],
    prefix: iconPackPrefix,
    filename: iconName,
    svgPath: svgPaths.length === 1 ? svgPaths[0].d : svgPaths,
    svgContent,
    svgViewbox,
  };

  return icon;
};

export const initIconPacks = async (plugin: Plugin): Promise<void> => {
  await createDefaultDirectory(plugin);

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
    }
  }
};

export const addIconToIconPack = (iconPackName: string, iconName: string, iconContent: string): void => {
  const icon = generateIcon(iconPackName, iconName, iconContent);
  const iconPack = iconPacks.find((iconPack) => iconPack.name === iconPackName);
  iconPack.icons.push(icon);
};

export const getAllLoadedIconNames = (): Icon[] => {
  return iconPacks.reduce((total: Icon[], iconPack) => {
    total.push(...iconPack.icons);
    return total;
  }, []);
};

export const getSvgFromLoadedIcon = (iconName: string): string => {
  let icon = '';
  iconPacks.forEach((iconPack) => {
    const foundIcon = iconPack.icons.find((icon) => icon.name.toLowerCase() === iconName.toLowerCase());
    if (foundIcon) {
      let fileContent = '';
      if (typeof foundIcon.svgPath === 'object') {
        const svgContent = foundIcon.svgPath.reduce((total, current) => {
          total += `<path fill="${current.fill}" d="${current.d}" />`;
          return total;
        }, '');

        fileContent = `<svg width="16" height="16" ${foundIcon.svgViewbox}>${svgContent}</svg>`;
      } else {
        fileContent = `<svg width="16" height="16" ${
          foundIcon.svgPath.includes('fill=') ? '' : 'fill="currentColor"'
        } ${foundIcon.svgViewbox}><path d="${foundIcon.svgPath}" /></svg>`;
      }
      icon = fileContent;
      return;
    }
  });

  return icon;
};
